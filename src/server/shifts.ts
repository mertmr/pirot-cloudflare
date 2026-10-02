import { operationDate } from './operation-context';
import { TenantStore } from './storage';
import { Corrections } from './corrections';
import type { CurrentUser } from './env';
import { BusinessError, Decimal, type Entity, type JsonObject, decimal, money, text, clone } from './value';
export class Shifts {
  readonly corrections: Corrections;
  constructor(
    readonly store: TenantStore,
    readonly actor: CurrentUser,
  ) {
    this.corrections = new Corrections(store, actor);
  }
  systemCash(at = operationDate().toISOString()): string {
    const latest = this.store.latest('kasa-hareketleris', at);
    if (!latest || latest.kasaMiktar == null) throw new BusinessError('cashrequired');
    return money(latest.kasaMiktar);
  }
  breakdown(opening: Entity, at: string, cash: string): JsonObject {
    const openingCash = decimal(opening.pirot, '0');
    const totals: Record<string, Decimal> = {
      SATIS: new Decimal(0),
      TAHSILAT: new Decimal(0),
      GIDER: new Decimal(0),
      VIRMAN: new Decimal(0),
      IADE: new Decimal(0),
      DIGER: new Decimal(0),
    };
    const movements: JsonObject[] = [
      ...this.store.rows('kasa-hareketleris', "json_extract(data,'$.tarih')>=? AND json_extract(data,'$.tarih')<=?", [
        String(opening.tarih),
        at,
      ]),
    ].map(m => {
      const delta = decimal(m.degisimTutari, '0');
      const type = text(m.hareketTipi, 'DIGER');
      totals[type in totals ? type : 'DIGER'] = totals[type in totals ? type : 'DIGER'].plus(delta);
      return { id: m.id, time: m.tarih, message: m.hareket, type, delta: delta.toFixed(2), balance: m.kasaMiktar };
    });
    let expected = openingCash.plus(Object.values(totals).reduce((sum, d) => sum.plus(d), new Decimal(0)));
    const residual = decimal(cash).minus(expected);
    if (!residual.isZero()) {
      totals.DIGER = totals.DIGER.plus(residual);
      movements.push({ time: at, message: 'Kasa bakiyesiyle mutabakat farkı', type: 'DIGER', delta: residual.toFixed(2) });
      expected = decimal(cash);
    }
    return {
      openingCash: openingCash.toFixed(2),
      satis: totals.SATIS.toFixed(2),
      tahsilat: totals.TAHSILAT.toFixed(2),
      gider: totals.GIDER.toFixed(2),
      virman: totals.VIRMAN.toFixed(2),
      iade: totals.IADE.toFixed(2),
      diger: totals.DIGER.toFixed(2),
      expectedCash: expected.toFixed(2),
      currentSystemCash: cash,
      reconciled: residual.isZero(),
      movements,
    };
  }
  workflow(): JsonObject {
    const at = operationDate().toISOString(),
      opening = this.corrections.activeOpening(),
      cash = this.systemCash(at);
    return {
      nextAction: opening ? 'KAPANIS' : 'ACILIS',
      systemCash: cash,
      serverTime: at,
      openingTarih: opening?.tarih ?? null,
      openingFark: opening?.fark ?? null,
      activeOpening: !!opening,
      breakdown: opening ? this.breakdown(opening, at, cash) : null,
    };
  }
  save(request: JsonObject, id?: number): Entity {
    if (id) {
      const old = this.store.get('nobet-hareketleris', id),
        before = clone(old);
      if (!decimal(old.fark, '0').isZero() && !text(request.notlar, text(old.notlar)).trim()) throw new BusinessError('notesrequired');
      if (request.notlar !== undefined) old.notlar = text(request.notlar);
      if (text(old.notlar).length > 5000) throw new BusinessError('invalidrequest');
      this.store.put('nobet-hareketleris', old);
      this.store.audit('nobet-hareketleris', id, this.actor, 'UPDATE_NOTES', before, old);
      return this.store.hydrate('nobet-hareketleris', old);
    }
    const opening = this.corrections.activeOpening(),
      next = opening ? 'KAPANIS' : 'ACILIS';
    if (request.acilisKapanis !== next) throw new BusinessError('invalidtransition', 409);
    const cash = money(request.kasa);
    if (decimal(cash).lt(0)) throw new BusinessError('invalidamount');
    const system = this.systemCash(),
      difference = decimal(cash).minus(system);
    const notes = text(request.notlar);
    if (!difference.isZero() && !notes.trim()) throw new BusinessError('notesrequired');
    if (notes.length > 5000) throw new BusinessError('invalidrequest');
    const at = operationDate().toISOString();
    const result: Entity = {
      id: this.store.next('nobet-hareketleris'),
      tenantId: this.actor.tenantId,
      kasa: cash,
      pirot: system,
      fark: difference.toFixed(2),
      farkDenge: '0.00',
      nobetSuresi: '0.00',
      notlar: notes,
      acilisKapanis: next,
      tarih: at,
      user: this.store.user(this.actor.id),
    };
    if (opening) {
      const milliseconds = Date.parse(at) - Date.parse(text(opening.tarih));
      if (milliseconds < 0) throw new BusinessError('invalidtransition');
      result.farkDenge = difference.minus(decimal(opening.fark, '0')).toFixed(2);
      result.nobetSuresi = new Decimal(milliseconds).div(3600000).toFixed(2);
      result.acilisId = opening.id;
      result.kapanisDokumu = JSON.stringify(this.breakdown(opening, at, system));
    }
    this.store.put('nobet-hareketleris', result);
    this.store.audit('nobet-hareketleris', result.id, this.actor, 'CREATE', null, result);
    return this.store.hydrate('nobet-hareketleris', result);
  }
}
