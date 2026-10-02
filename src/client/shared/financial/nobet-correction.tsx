import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { Link } from 'app/shared/routing/navigation';
import { TextFormat, Translate, translate } from 'react-jhipster';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { correctionContext, shiftCorrections, settleCorrection } from 'app/entities/nobet-hareketleri/nobet-duzeltme.api';
import { ICorrectionContext, IDuzeltmeTalebi, INobetDuzeltme } from 'app/shared/model/nobet-duzeltme.model';

export const CorrectionHistory = ({ items, onSettled }: { items: INobetDuzeltme[]; onSettled?: () => void }) => {
  const [busy, setBusy] = useState<number>();
  const [confirm, setConfirm] = useState<number>();
  const [error, setError] = useState(false);
  const settle = async (id: number) => {
    setBusy(id);
    setError(false);
    try {
      await settleCorrection(id);
      setConfirm(undefined);
      onSettled?.();
    } catch {
      setError(true);
    } finally {
      setBusy(undefined);
    }
  };
  if (!items.length)
    return (
      <p>
        <Translate contentKey="correction.empty" />
      </p>
    );
  return (
    <section>
      <h3>
        <Translate contentKey="correction.history" />
      </h3>
      {error && (
        <Alert variant="danger">
          <Translate contentKey="correction.settleError" />
        </Alert>
      )}
      <Table responsive>
        <thead>
          <tr>
            {['source', 'reason', 'actor', 'cash', 'pending'].map(k => (
              <th key={k}>
                <Translate contentKey={`correction.${k}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(a => (
            <tr key={a.id}>
              <td>
                <Link to={`/${a.kaynakTipi}/${a.kaynakId}`}>
                  {a.kaynakTipi} #{a.kaynakId}
                </Link>
                <br />
                <Link to={`/nobet-hareketleri/${a.kapanisId}`}>#{a.kapanisId}</Link> →{' '}
                <Link to={`/nobet-hareketleri/${a.nobetAcilisId}`}>#{a.nobetAcilisId}</Link>
              </td>
              <td>
                {a.neden}
                <details>
                  <summary>
                    <Translate contentKey="correction.values" />
                  </summary>
                  <p>
                    <Translate contentKey="correction.before" />
                  </p>
                  <SnapshotValues value={a.onceki} />
                  <p>
                    <Translate contentKey="correction.after" />
                  </p>
                  <SnapshotValues value={a.sonraki} />
                </details>
              </td>
              <td>
                {a.kullanici}
                <br />
                {a.tarih && <TextFormat value={a.tarih} type="date" format={APP_DATE_FORMAT} />}
              </td>
              <td>
                {Number(a.kasaDegisimi).toFixed(2)} TL
                <br />
                <Translate
                  contentKey={
                    Number(a.kasaDegisimi) === 0
                      ? 'correction.noCashEffect'
                      : a.nakitSimdi
                        ? 'correction.exchanged'
                        : 'correction.recordOnly'
                  }
                />
              </td>
              <td>
                {Number(a.bekleyenKasa).toFixed(2)} TL
                {Number(a.bekleyenKasa) !== 0 && onSettled && (
                  <>
                    {confirm === a.id ? (
                      <>
                        <p>
                          <Translate contentKey="correction.settleConfirm" interpolate={{ amount: Number(a.bekleyenKasa).toFixed(2) }} />
                        </p>
                        <Button disabled={busy !== undefined} onClick={() => settle(a.id)}>
                          <Translate contentKey="correction.confirmCash" />
                        </Button>
                        <Button variant="secondary" onClick={() => setConfirm(undefined)}>
                          <Translate contentKey="entity.action.cancel" />
                        </Button>
                      </>
                    ) : (
                      <Button disabled={busy !== undefined} onClick={() => setConfirm(a.id)}>
                        <Translate contentKey="correction.settle" />
                      </Button>
                    )}
                  </>
                )}
                {a.odemeNobetId != null && (
                  <>
                    <Link to={`/nobet-hareketleri/${a.odemeNobetId}`}>
                      <Translate contentKey="correction.settled" /> #{a.odemeNobetId} · {a.odemeKullanici}
                    </Link>
                    <br />
                    {a.odemeTarihi && <TextFormat value={a.odemeTarihi} type="date" format={APP_DATE_FORMAT} />}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  );
};

export const CorrectionFields = ({
  type,
  id,
  onChange,
  onBlocked,
  onClosed,
}: {
  type: string;
  id?: string | number;
  onChange: (v: IDuzeltmeTalebi | undefined) => void;
  onBlocked: (v: boolean) => void;
  onClosed?: (v: boolean) => void;
}) => {
  const [context, setContext] = useState<ICorrectionContext>();
  const [reason, setReason] = useState('');
  const [choice, setChoice] = useState('');
  const [error, setError] = useState(false);
  const load = () => {
    if (!id) return;
    setError(false);
    correctionContext(type, id)
      .then(setContext)
      .catch(() => setError(true));
  };
  useEffect(() => {
    let current = true;
    setContext(undefined);
    setReason('');
    setChoice('');
    setError(false);
    if (id)
      correctionContext(type, id)
        .then(v => {
          if (current) setContext(v);
        })
        .catch(() => {
          if (current) setError(true);
        });
    return () => {
      current = false;
    };
  }, [type, id]);
  useEffect(() => {
    const closed = !!context?.kapanisId;
    onClosed?.(closed);
    const pending = context?.duzeltmeler.some(a => Number(a.bekleyenKasa) !== 0);
    onBlocked(!!id && (!context || error || context.iptal || !!pending || (closed && (!reason.trim() || !choice))));
    onChange(closed && reason.trim() && choice ? { neden: reason.trim(), nakitSimdi: choice === 'now' } : undefined);
  }, [context, error, id, reason, choice, onChange, onBlocked, onClosed]);
  if (!id) return null;
  if (error)
    return (
      <Alert variant="danger">
        <Translate contentKey="correction.loadError" />{' '}
        <Button onClick={load}>
          <Translate contentKey="correction.retry" />
        </Button>
      </Alert>
    );
  if (!context)
    return (
      <p role="status">
        <Translate contentKey="correction.loading" />
      </p>
    );
  return (
    <>
      {context.iptal && (
        <Alert variant="secondary">
          <Translate contentKey="correction.cancelled" />
        </Alert>
      )}
      {!!context.kapanisId && !context.iptal && (
        <Alert variant="warning">
          <p>
            <Translate contentKey="correction.closed" /> <Link to={`/nobet-hareketleri/${context.kapanisId}`}>#{context.kapanisId}</Link>
          </p>
          <Form.Group>
            <Form.Label htmlFor="correction-reason">
              <Translate contentKey="correction.reason" />
            </Form.Label>
            <Form.Control id="correction-reason" maxLength={500} value={reason} onChange={e => setReason(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label htmlFor="correction-cash">
              <Translate contentKey="correction.cashChoice" />
            </Form.Label>
            <Form.Select id="correction-cash" value={choice} onChange={e => setChoice(e.target.value)}>
              <option value="">{translate('correction.choose')}</option>
              <option value="now">{translate('correction.now')}</option>
              <option value="later">{translate('correction.later')}</option>
            </Form.Select>
          </Form.Group>
          <p>
            <Translate contentKey="correction.explanation" />
          </p>
        </Alert>
      )}
      <CorrectionHistory items={context.duzeltmeler} onSettled={load} />
    </>
  );
};

export const ShiftCorrectionHistory = ({ id }: { id: string }) => {
  const [items, setItems] = useState<INobetDuzeltme[]>([]);
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    shiftCorrections(id)
      .then(setItems)
      .catch(() => setError(true));
  };
  useEffect(load, [id]);
  return error ? (
    <Alert variant="danger">
      <Translate contentKey="correction.loadError" />{' '}
      <Button onClick={load}>
        <Translate contentKey="correction.retry" />
      </Button>
    </Alert>
  ) : (
    <CorrectionHistory items={items} onSettled={load} />
  );
};

export const CorrectionRecord = ({ type, id }: { type: string; id: string }) => {
  const [context, setContext] = useState<ICorrectionContext>();
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    correctionContext(type, id)
      .then(setContext)
      .catch(() => setError(true));
  };
  useEffect(load, [type, id]);
  return error ? (
    <Alert variant="danger">
      <Translate contentKey="correction.loadError" />
    </Alert>
  ) : context ? (
    <>
      {context.iptal && (
        <Alert variant="secondary">
          <Translate contentKey="correction.cancelled" />
        </Alert>
      )}
      <CorrectionHistory items={context.duzeltmeler} onSettled={load} />
    </>
  ) : null;
};

const SnapshotValues = ({ value }: { value: string }) => {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(value) as Record<string, unknown>;
  } catch {
    return <p>{value}</p>;
  }
  return (
    <dl>
      {Object.entries(data).map(([key, val]) => (
        <React.Fragment key={key}>
          <dt>
            <Translate contentKey={`correction.fields.${key}`} />
          </dt>
          <dd>
            {key === 'satirlar' && Array.isArray(val) ? (
              <Table size="sm">
                <thead>
                  <tr>
                    <th>
                      <Translate contentKey="correction.fields.urun" />
                    </th>
                    <th>
                      <Translate contentKey="correction.fields.miktar" />
                    </th>
                    <th>
                      <Translate contentKey="correction.fields.tutar" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {val.map((line: { urun: string; miktar: number; tutar: number }, i: number) => (
                    <tr key={i}>
                      <td>{line.urun}</td>
                      <td>{line.miktar}</td>
                      <td>{Number(line.tutar).toFixed(2)} TL</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : typeof val === 'boolean' ? (
              <Translate contentKey={val ? 'correction.yes' : 'correction.no'} />
            ) : typeof val === 'string' || typeof val === 'number' ? (
              String(val)
            ) : (
              '—'
            )}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};
