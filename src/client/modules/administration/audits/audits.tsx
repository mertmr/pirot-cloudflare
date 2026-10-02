import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import { useSearchParams } from 'app/shared/routing/navigation';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { JhiItemCount, JhiPagination, Translate } from 'react-jhipster';

import { APP_TIMESTAMP_FORMAT } from 'app/config/constants';
import CustomTextFormat from 'app/shared/util/CustomTextFormat';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';

type AuditEvent = {
  timestamp?: string;
  principal?: string;
  type?: string;
  data?: {
    message?: string;
    remoteAddress?: string;
  };
};

const previousMonth = () => {
  const now = new Date();
  const fromDate =
    now.getMonth() === 0
      ? new Date(now.getFullYear() - 1, 11, now.getDate())
      : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return fromDate.toISOString().slice(0, 10);
};

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

export const AuditsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = searchParams.get('sort')?.split(',') ?? ['auditEventDate', 'desc'];
  const [activePage, setActivePage] = useState(Number(searchParams.get('page') ?? 1));
  const [sort, setSort] = useState(initialSort[0]);
  const [order, setOrder] = useState(initialSort[1] === 'asc' ? 'asc' : 'desc');
  const [fromDate, setFromDate] = useState(previousMonth());
  const [toDate, setToDate] = useState(tomorrow());
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setSearchParams({ page: String(activePage), sort: `${sort},${order}` }, { replace: true });
  }, [activePage, order, setSearchParams, sort]);

  useEffect(() => {
    axios
      .get<AuditEvent[]>('management/audits', {
        params: {
          page: activePage - 1,
          size: ITEMS_PER_PAGE,
          sort: `${sort},${order}`,
          fromDate,
          toDate,
        },
      })
      .then(response => {
        setAudits(response.data);
        setTotalItems(Number(response.headers['x-total-count'] ?? response.data.length));
      });
  }, [activePage, fromDate, order, sort, toDate]);

  const changeSort = (property: string) => {
    setActivePage(1);
    if (sort === property) {
      setOrder(current => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(property);
      setOrder('asc');
    }
  };

  return (
    <div>
      <h2 id="audits-page-heading">Audits</h2>
      <Row className="g-3 mb-3">
        <Form.Group className="col-md-6" controlId="fromDate">
          <Form.Label>
            <Translate contentKey="audits.filter.from">from</Translate>
          </Form.Label>
          <Form.Control type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} />
        </Form.Group>
        <Form.Group className="col-md-6" controlId="toDate">
          <Form.Label>
            <Translate contentKey="audits.filter.to">to</Translate>
          </Form.Label>
          <Form.Control type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
        </Form.Group>
      </Row>

      {audits.length > 0 ? (
        <>
          <Table striped responsive>
            <thead>
              <tr>
                <th role="button" onClick={() => changeSort('auditEventDate')}>
                  <Translate contentKey="audits.table.header.date">Date</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th role="button" onClick={() => changeSort('principal')}>
                  <Translate contentKey="audits.table.header.principal">User</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th role="button" onClick={() => changeSort('auditEventType')}>
                  <Translate contentKey="audits.table.header.status">State</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th>
                  <Translate contentKey="audits.table.header.data">Extra data</Translate>
                </th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit, index) => (
                <tr key={`${audit.timestamp}-${audit.principal}-${index}`}>
                  <td>
                    <CustomTextFormat value={audit.timestamp} type="date" format={APP_TIMESTAMP_FORMAT} />
                  </td>
                  <td>{audit.principal}</td>
                  <td>{audit.type}</td>
                  <td>{[audit.data?.message, audit.data?.remoteAddress].filter(Boolean).join(' ')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Row className="justify-content-center">
            <JhiItemCount page={activePage} total={totalItems} itemsPerPage={ITEMS_PER_PAGE} i18nEnabled />
          </Row>
          <Row className="justify-content-center">
            <JhiPagination
              activePage={activePage}
              onSelect={page => setActivePage(page)}
              maxButtons={5}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={totalItems}
            />
          </Row>
        </>
      ) : (
        <div className="alert alert-warning">
          <Translate contentKey="audits.notFound">No audit found</Translate>
        </div>
      )}
    </div>
  );
};

export default AuditsPage;
