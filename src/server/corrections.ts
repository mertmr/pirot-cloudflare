import { operationDate } from './operation-context';
import type { CurrentUser } from './env';
import type { EntityKind } from './entity-specs';
import { TenantStore } from './storage';
import { BusinessError, type Entity, type JsonObject, decimal, object, text, flag, clone, money } from './value';
export class Corrections {
  constructor(
    readonly store: TenantStore,
    readonly actor: CurrentUser,
  ) {}
  activeOpening(): Entity | null {
    const rows = this.store
      .matching('nobet-hareketleris', 'user.id', this.actor.id)
      .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)) || b.id - a.id);
    return rows[0]?.acilisKapanis === 'ACILIS' ? rows[0] : null;
  }
  closing(kind: EntityKind, entity: Entity): number | null {
    const type = kind === 'satis' ? 'satis' : kind === 'giders' ? 'gider' : 'virman';
    const audits = this.store.all('nobet-duzeltmeler').filter(a => a.kaynakTipi === type && a.kaynakId === entity.id);
    if (audits.length) return Number(audits[0].kapanisId);
    if (entity.nobetAcilisId) {
      const close = this.store.matching('nobet-hareketleris', 'acilisId', Number(entity.nobetAcilisId))[0];
      if (close) return close.id;
    }
    if (!entity.user || !entity.tarih) return null;
    const shifts = this.store
      .matching('nobet-hareketleris', 'user.id', Number(object(entity.user).id))
      .sort((a, b) => String(a.tarih).localeCompare(String(b.tarih)) || a.id - b.id);
    let opening: Entity | null = null;
    for (const s of shifts) {
      if (
        s.acilisKapanis === 'KAPANIS' &&
        opening &&
        String(entity.tarih) >= String(opening.tarih) &&
        String(entity.tarih) <= String(s.tarih)
      )
        return s.id;
      opening = s.acilisKapanis === 'ACILIS' ? s : null;
    }
    return null;
  }
  begin(kind: EntityKind, entity: Entity, intent: unknown, operation: string): Entity | null {
    if (entity.iptal) throw new BusinessError('cancelled');
    const closing = this.closing(kind, entity);
    if (closing === null) {
      if (intent != null) throw new BusinessError('notclosed');
      return null;
    }
    if (!intent) throw new BusinessError('correctionrequired');
    const request = object(intent);
    const reason = text(request.neden).trim();
    if (!reason || reason.length > 500 || typeof request.nakitSimdi !== 'boolean') throw new BusinessError('reasonrequired');
    const type = kind === 'satis' ? 'satis' : kind === 'giders' ? 'gider' : 'virman';
    if (
      this.store
        .all('nobet-duzeltmeler')
        .some(a => a.kaynakTipi === type && a.kaynakId === entity.id && !decimal(a.bekleyenKasa, '0').isZero())
    )
      throw new BusinessError('pendingcorrection');
    const opening = this.activeOpening();
    if (!opening) throw new BusinessError('activeshiftrequired');
    return {
      id: this.store.next('nobet-duzeltmeler'),
      tenantId: this.actor.tenantId,
      kaynakTipi: type,
      kaynakId: entity.id,
      kapanisId: closing,
      nobetAcilisId: opening.id,
      neden: reason,
      islem: operation,
      kullanici: this.actor.login,
      tarih: operationDate().toISOString(),
      onceki: this.snapshot(kind, entity),
      nakitSimdi: flag(request.nakitSimdi),
    };
  }
  snapshot(kind: EntityKind, entity: Entity): string {
    const m: JsonObject = { id: entity.id, tarih: entity.tarih ?? null, iptal: entity.iptal ?? false };
    if (kind === 'satis') {
      for (const key of ['toplamTutar', 'kartliSatis', 'sonraOdeme', 'odendi', 'ortagaSatis']) m[key] = entity[key] ?? null;
      m.user = entity.user ? (object(entity.user).login ?? null) : null;
      m.kisiId = entity.kisi ? object(entity.kisi).id : null;
      m.satirlar = this.store.matching('satis-stok-hareketleris', 'satis.id', entity.id).map(l => {
        const product = this.store.get('uruns', Number(object(l.urun).id));
        return { urunId: product.id, urun: product.urunAdi, miktar: l.miktar, tutar: l.tutar };
      });
    } else
      for (const key of ['tutar', 'notlar', 'odemeAraci', 'giderTipi', 'cikisHesabi', 'girisHesabi'])
        if (entity[key] !== undefined) m[key] = entity[key];
    return JSON.stringify(m);
  }
  cash(delta: unknown, message: string, category: string, correctionId?: number) {
    const amount = decimal(delta);
    if (amount.isZero()) return;
    const latest = this.store.latest('kasa-hareketleris');
    const row: Entity = {
      id: this.store.next('kasa-hareketleris'),
      tenantId: this.actor.tenantId,
      kasaMiktar: money(decimal(latest?.kasaMiktar, '0').plus(amount).toFixed(2)),
      degisimTutari: amount.toFixed(2),
      hareket: message,
      hareketTipi: category,
      tarih: operationDate().toISOString(),
      duzeltmeId: correctionId ?? null,
    };
    this.store.put('kasa-hareketleris', row);
    this.store.audit('kasa-hareketleris', row.id, this.actor, 'CREATE', null, row);
  }
  finish(kind: EntityKind, audit: Entity | null, entity: Entity, delta: unknown, category: string, message: string) {
    const change = decimal(delta);
    if (!audit) {
      this.cash(change.toFixed(2), message, category);
      return;
    }
    audit.sonraki = this.snapshot(kind, entity);
    audit.kasaDegisimi = change.toFixed(2);
    audit.bekleyenKasa = audit.nakitSimdi ? '0.00' : change.toFixed(2);
    this.store.put('nobet-duzeltmeler', audit);
    this.store.audit('nobet-duzeltmeler', audit.id, this.actor, 'CREATE', null, audit);
    if (audit.nakitSimdi)
      this.cash(change.toFixed(2), `Kapanış sonrası düzeltme #${audit.id} / Nöbet #${audit.kapanisId}`, category, audit.id);
  }
  settle(id: number): Entity {
    const audit = this.store.get('nobet-duzeltmeler', id);
    if (decimal(audit.bekleyenKasa, '0').isZero()) return audit;
    const opening = this.activeOpening();
    if (!opening) throw new BusinessError('activeshiftrequired');
    const before = clone(audit);
    this.cash(audit.bekleyenKasa, `Düzeltme ödemesi #${id} / Nöbet #${audit.kapanisId}`, 'DIGER', id);
    if (audit.kaynakTipi === 'satis' && decimal(audit.kasaDegisimi, '0').gt(0)) {
      const sale = this.store.get('satis', Number(audit.kaynakId));
      if (!sale.iptal) {
        sale.odendi = true;
        this.store.put('satis', sale);
      }
    }
    audit.bekleyenKasa = '0.00';
    audit.odemeTarihi = operationDate().toISOString();
    audit.odemeNobetId = opening.id;
    audit.odemeKullanici = this.actor.login;
    this.store.put('nobet-duzeltmeler', audit);
    this.store.audit('nobet-duzeltmeler', id, this.actor, 'SETTLE', before, audit);
    return audit;
  }
  context(type: string, id: number): JsonObject {
    const kind: EntityKind =
      type === 'satis'
        ? 'satis'
        : type === 'gider'
          ? 'giders'
          : type === 'virman'
            ? 'virmen'
            : (() => {
                throw new BusinessError('notfound', 404);
              })();
    const entity = this.store.get(kind, id);
    return {
      kapanisId: this.closing(kind, entity),
      iptal: entity.iptal ?? false,
      duzeltmeler: this.store.all('nobet-duzeltmeler').filter(a => a.kaynakTipi === type && a.kaynakId === id),
    };
  }
  forShift(id: number): Entity[] {
    const shift = this.store.get('nobet-hareketleris', id);
    const opening = shift.acilisKapanis === 'ACILIS' ? id : shift.acilisId;
    return this.store.all('nobet-duzeltmeler').filter(a => a.kapanisId === id || a.nobetAcilisId === opening || a.odemeNobetId === opening);
  }
}
