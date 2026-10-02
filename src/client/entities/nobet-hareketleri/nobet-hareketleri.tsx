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

import { getEntities } from './nobet-hareketleri.reducer';

export const NobetHareketleri = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id'), pageLocation.search),
  );

  const nobetHareketleriList = useAppSelector(state => state.nobetHareketleri.entities);
  const loading = useAppSelector(state => state.nobetHareketleri.loading);
  const totalItems = useAppSelector(state => state.nobetHareketleri.totalItems);

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
      <h2 id="nobet-hareketleri-heading" data-cy="NobetHareketleriHeading">
        <Translate contentKey="koopApp.nobetHareketleri.home.title">Nobet Hareketleris</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" variant="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="koopApp.nobetHareketleri.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/nobet-hareketleri/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="koopApp.nobetHareketleri.home.createLabel">Create new Nobet Hareketleri</Translate>
          </Link>
        </div>
      </h2>
      <div className="table-responsive">
        {nobetHareketleriList?.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="koopApp.nobetHareketleri.id">ID</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('kasa')}>
                  <Translate contentKey="koopApp.nobetHareketleri.kasa">Kasa</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('kasa')} />
                </th>
                <th className="hand" onClick={sort('pirot')}>
                  <Translate contentKey="koopApp.nobetHareketleri.pirot">Pirot</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('pirot')} />
                </th>
                <th className="hand" onClick={sort('fark')}>
                  <Translate contentKey="koopApp.nobetHareketleri.fark">Fark</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('fark')} />
                </th>
                <th className="hand" onClick={sort('farkDenge')}>
                  <Translate contentKey="koopApp.nobetHareketleri.farkDenge">Fark Denge</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('farkDenge')} />
                </th>
                <th className="hand" onClick={sort('nobetSuresi')}>
                  <Translate contentKey="koopApp.nobetHareketleri.nobetSuresi">Nobet Suresi</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('nobetSuresi')} />
                </th>
                <th className="hand" onClick={sort('notlar')}>
                  <Translate contentKey="koopApp.nobetHareketleri.notlar">Notlar</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('notlar')} />
                </th>
                <th className="hand" onClick={sort('acilisKapanis')}>
                  <Translate contentKey="koopApp.nobetHareketleri.acilisKapanis">Acilis Kapanis</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('acilisKapanis')} />
                </th>
                <th className="hand" onClick={sort('tarih')}>
                  <Translate contentKey="koopApp.nobetHareketleri.tarih">Tarih</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('tarih')} />
                </th>
                <th>
                  <Translate contentKey="koopApp.nobetHareketleri.user">User</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {nobetHareketleriList.map(nobetHareketleri => (
                <tr key={`entity-${nobetHareketleri.id}`} data-cy="entityTable">
                  <td>
                    <Button as={Link as any} to={`/nobet-hareketleri/${nobetHareketleri.id}`} variant="link" size="sm">
                      {nobetHareketleri.id}
                    </Button>
                  </td>
                  <td>{nobetHareketleri.kasa}</td>
                  <td>{nobetHareketleri.pirot}</td>
                  <td>{nobetHareketleri.fark}</td>
                  <td>{nobetHareketleri.farkDenge}</td>
                  <td>{nobetHareketleri.nobetSuresi}</td>
                  <td>{nobetHareketleri.notlar}</td>
                  <td>
                    <Translate contentKey={`koopApp.AcilisKapanis.${nobetHareketleri.acilisKapanis}`} />
                  </td>
                  <td>
                    {nobetHareketleri.tarih ? <TextFormat type="date" value={nobetHareketleri.tarih} format={APP_DATE_FORMAT} /> : null}
                  </td>
                  <td>{nobetHareketleri.user ? nobetHareketleri.user.login : ''}</td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button
                        as={Link as any}
                        to={`/nobet-hareketleri/${nobetHareketleri.id}`}
                        variant="info"
                        size="sm"
                        data-cy="entityDetailsButton"
                      >
                        <FontAwesomeIcon icon="eye" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.view">View</Translate>
                        </span>
                      </Button>
                      <Button
                        as={Link as any}
                        to={`/nobet-hareketleri/${nobetHareketleri.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        variant="primary"
                        size="sm"
                        data-cy="entityEditButton"
                      >
                        <FontAwesomeIcon icon="pencil-alt" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.edit">Edit</Translate>
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
              <Translate contentKey="koopApp.nobetHareketleri.home.notFound">No Nobet Hareketleris found</Translate>
            </div>
          )
        )}
      </div>
      {totalItems ? (
        <div className={nobetHareketleriList && nobetHareketleriList.length > 0 ? '' : 'd-none'}>
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
    </div>
  );
};

export default NobetHareketleri;
