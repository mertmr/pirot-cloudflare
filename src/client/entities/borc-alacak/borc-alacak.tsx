import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { JhiItemCount, JhiPagination, TextFormat, Translate, getPaginationState } from 'react-jhipster';
import { Link, useLocation, useNavigate } from 'app/shared/routing/navigation';

import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';

import { collectPayment, getEntities } from './borc-alacak.reducer';
import { isCollectableBorc } from './borc-alacak.util';
import { CollectPaymentDialog } from './collect-payment-dialog';

export const BorcAlacak = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id'), pageLocation.search),
  );
  const [collectTargetId, setCollectTargetId] = useState<number | null>(null);

  const borcAlacakList = useAppSelector(state => state.borcAlacak.entities);
  const loading = useAppSelector(state => state.borcAlacak.loading);
  const updating = useAppSelector(state => state.borcAlacak.updating);
  const updateSuccess = useAppSelector(state => state.borcAlacak.updateSuccess);
  const totalItems = useAppSelector(state => state.borcAlacak.totalItems);

  const getAllEntities = () => {
    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }),
    );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (pageLocation.search !== endURL) {
      navigate(`${pageLocation.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

  // A collected payment flips the debt row and its cash effect; refresh so the
  // list shows the settled state instead of only patching one row.
  useEffect(() => {
    if (updateSuccess) {
      sortEntities();
      setCollectTargetId(null);
    }
  }, [updateSuccess]);

  useEffect(() => {
    const params = new URLSearchParams(pageLocation.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [pageLocation.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  const getSortIconByFieldName = (fieldName: string) => {
    const sortFieldName = paginationState.sort;
    const { order } = paginationState;
    if (sortFieldName !== fieldName) {
      return faSort;
    }
    return order === ASC ? faSortUp : faSortDown;
  };

  return (
    <div>
      <h2 id="borc-alacak-heading" data-cy="BorcAlacakHeading">
        <Translate contentKey="koopApp.borcAlacak.home.title">Borc Alacaks</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" variant="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="koopApp.borcAlacak.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/borc-alacak/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="koopApp.borcAlacak.home.createLabel">Create new Borc Alacak</Translate>
          </Link>
        </div>
      </h2>
      <div className="table-responsive">
        {borcAlacakList?.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="koopApp.borcAlacak.id">ID</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('tutar')}>
                  <Translate contentKey="koopApp.borcAlacak.tutar">Tutar</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('tutar')} />
                </th>
                <th className="hand" onClick={sort('notlar')}>
                  <Translate contentKey="koopApp.borcAlacak.notlar">Notlar</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('notlar')} />
                </th>
                <th className="hand" onClick={sort('odemeAraci')}>
                  <Translate contentKey="koopApp.borcAlacak.odemeAraci">Odeme Araci</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('odemeAraci')} />
                </th>
                <th className="hand" onClick={sort('hareketTipi')}>
                  <Translate contentKey="koopApp.borcAlacak.hareketTipi">Hareket Tipi</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('hareketTipi')} />
                </th>
                <th className="hand" onClick={sort('tarih')}>
                  <Translate contentKey="koopApp.borcAlacak.tarih">Tarih</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('tarih')} />
                </th>
                <th>
                  <Translate contentKey="koopApp.borcAlacak.user">User</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th>
                  <Translate contentKey="koopApp.borcAlacak.urun">Urun</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {borcAlacakList.map(borcAlacak => (
                <tr key={`entity-${borcAlacak.id}`} data-cy="entityTable">
                  <td>
                    <Button as={Link as any} to={`/borc-alacak/${borcAlacak.id}`} variant="link" size="sm">
                      {borcAlacak.id}
                    </Button>
                  </td>
                  <td>{borcAlacak.tutar}</td>
                  <td>{borcAlacak.notlar}</td>
                  <td>
                    <Translate contentKey={`koopApp.OdemeAraci.${borcAlacak.odemeAraci}`} />
                  </td>
                  <td>
                    <Translate contentKey={`koopApp.HareketTipi.${borcAlacak.hareketTipi}`} />
                  </td>
                  <td>{borcAlacak.tarih ? <TextFormat type="date" value={borcAlacak.tarih} format={APP_DATE_FORMAT} /> : null}</td>
                  <td>{borcAlacak.user ? borcAlacak.user.login : ''}</td>
                  <td>{borcAlacak.urun ? <Link to={`/urun/${borcAlacak.urun.id}`}>{borcAlacak.urun.urunAdi}</Link> : ''}</td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      {isCollectableBorc(borcAlacak) && (
                        <Button
                          variant="success"
                          size="sm"
                          data-cy="collectPaymentButton"
                          onClick={() => setCollectTargetId(borcAlacak.id ?? null)}
                        >
                          <FontAwesomeIcon icon="hand-holding-usd" />{' '}
                          <span className="d-none d-md-inline">
                            <Translate contentKey="entity.action.collectPayment">Collect Payment</Translate>
                          </span>
                        </Button>
                      )}
                      <Button as={Link as any} to={`/borc-alacak/${borcAlacak.id}`} variant="info" size="sm" data-cy="entityDetailsButton">
                        <FontAwesomeIcon icon="eye" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.view">View</Translate>
                        </span>
                      </Button>
                      <Button
                        as={Link as any}
                        to={`/borc-alacak/${borcAlacak.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        variant="primary"
                        size="sm"
                        data-cy="entityEditButton"
                      >
                        <FontAwesomeIcon icon="pencil-alt" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.edit">Edit</Translate>
                        </span>
                      </Button>
                      <Button
                        onClick={() =>
                          (globalThis.location.href = `/borc-alacak/${borcAlacak.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
                        }
                        variant="danger"
                        size="sm"
                        data-cy="entityDeleteButton"
                      >
                        <FontAwesomeIcon icon="trash" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.delete">Delete</Translate>
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          !loading && (
            <div className="alert alert-warning">
              <Translate contentKey="koopApp.borcAlacak.home.notFound">No Borc Alacaks found</Translate>
            </div>
          )
        )}
      </div>
      {totalItems ? (
        <div className={borcAlacakList && borcAlacakList.length > 0 ? '' : 'd-none'}>
          <div className="justify-content-center d-flex">
            <JhiItemCount page={paginationState.activePage} total={totalItems} itemsPerPage={paginationState.itemsPerPage} i18nEnabled />
          </div>
          <div className="justify-content-center d-flex">
            <JhiPagination
              activePage={paginationState.activePage}
              onSelect={handlePagination}
              maxButtons={5}
              itemsPerPage={paginationState.itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        </div>
      ) : (
        ''
      )}
      <CollectPaymentDialog
        show={collectTargetId !== null}
        saving={updating}
        onCancel={() => setCollectTargetId(null)}
        onConfirm={paymentMethod => {
          if (collectTargetId !== null) {
            dispatch(collectPayment({ id: collectTargetId, paymentMethod }));
          }
        }}
      />
    </div>
  );
};

export default BorcAlacak;
