import Table from 'react-bootstrap/Table';
import React, { useEffect } from 'react';
import { Link, useParams } from 'app/shared/routing/navigation';
import { TextFormat, Translate } from 'react-jhipster';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ShiftCorrectionHistory } from 'app/shared/financial/nobet-correction';
import { getEntity } from './nobet-hareketleri.reducer';
export const NobetHareketleriDetail = () => {
  const { id } = useParams<'id'>();
  const dispatch = useAppDispatch();
  const row = useAppSelector(s => s.nobetHareketleri.entity);
  useEffect(() => {
    if (id) dispatch(getEntity(id));
  }, [dispatch, id]);
  let breakdown: Record<string, unknown> | undefined;
  try {
    if (row.kapanisDokumu) breakdown = JSON.parse(row.kapanisDokumu) as Record<string, unknown>;
  } catch {
    breakdown = undefined;
  }
  return (
    <section>
      <h2>
        <Translate contentKey="koopApp.nobetHareketleri.detail.title" /> #{row.id}
      </h2>
      <p>
        {row.tarih && <TextFormat value={row.tarih} type="date" format={APP_DATE_FORMAT} />} · {row.user?.login} ·{' '}
        <Translate contentKey={`koopApp.AcilisKapanis.${row.acilisKapanis ?? 'null'}`} />
      </p>
      <p>
        <Translate contentKey="correction.snapshot" />
      </p>
      <dl>
        {['kasa', 'pirot', 'fark', 'farkDenge', 'nobetSuresi', 'notlar'].map(key => (
          <React.Fragment key={key}>
            <dt>
              <Translate contentKey={`koopApp.nobetHareketleri.${key}`} />
            </dt>
            <dd>{String(row[key as keyof typeof row] ?? '')}</dd>
          </React.Fragment>
        ))}
      </dl>
      {row.acilisId && (
        <Link to={`/nobet-hareketleri/${row.acilisId}`}>
          <Translate contentKey="correction.opening" /> #{row.acilisId}
        </Link>
      )}
      {breakdown && (
        <section>
          <h3>
            <Translate contentKey="correction.breakdown" />
          </h3>
          <Table responsive>
            <tbody>
              {['openingCash', 'satis', 'tahsilat', 'gider', 'virman', 'iade', 'diger', 'expectedCash'].map(key => (
                <tr key={key}>
                  <th>
                    <Translate contentKey={`correction.breakdownFields.${key}`} />
                  </th>
                  <td>{Number(breakdown?.[key] ?? 0).toFixed(2)} TL</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      )}
      {id && row.id === Number(id) && <ShiftCorrectionHistory id={id} />}
      <Link className="btn btn-info" to="/nobet-hareketleri">
        <Translate contentKey="entity.action.back" />
      </Link>{' '}
      <Link className="btn btn-primary" to={`/nobet-hareketleri/${row.id}/edit`}>
        <Translate contentKey="entity.action.edit" />
      </Link>
    </section>
  );
};
export default NobetHareketleriDetail;
