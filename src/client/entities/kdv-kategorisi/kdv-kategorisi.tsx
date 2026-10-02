import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { JhiItemCount, JhiPagination, Translate, getPaginationState } from 'react-jhipster';
import { Link, useLocation, useNavigate } from 'app/shared/routing/navigation';

import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';

import { getEntities } from './kdv-kategorisi.reducer';

export const KdvKategorisi = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id'), pageLocation.search),
  );

  const kdvKategorisiList = useAppSelector(state => state.kdvKategorisi.entities);
  const loading = useAppSelector(state => state.kdvKategorisi.loading);
  const totalItems = useAppSelector(state => state.kdvKategorisi.totalItems);

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
      <h2 id="kdv-kategorisi-heading" data-cy="KdvKategorisiHeading">
        <Translate contentKey="koopApp.kdvKategorisi.home.title">Kdv Kategorisis</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" variant="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="koopApp.kdvKategorisi.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/kdv-kategorisi/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="koopApp.kdvKategorisi.home.createLabel">Create new Kdv Kategorisi</Translate>
          </Link>
        </div>
      </h2>
      <div className="table-responsive">
        {kdvKategorisiList?.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="koopApp.kdvKategorisi.id">ID</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('kategoriAdi')}>
                  <Translate contentKey="koopApp.kdvKategorisi.kategoriAdi">Kategori Adi</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('kategoriAdi')} />
                </th>
                <th className="hand" onClick={sort('kdvOrani')}>
                  <Translate contentKey="koopApp.kdvKategorisi.kdvOrani">Kdv Orani</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('kdvOrani')} />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {kdvKategorisiList.map(kdvKategorisi => (
                <tr key={`entity-${kdvKategorisi.id}`} data-cy="entityTable">
                  <td>
                    <Button as={Link as any} to={`/kdv-kategorisi/${kdvKategorisi.id}`} variant="link" size="sm">
                      {kdvKategorisi.id}
                    </Button>
                  </td>
                  <td>{kdvKategorisi.kategoriAdi}</td>
                  <td>{kdvKategorisi.kdvOrani}</td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button
                        as={Link as any}
                        to={`/kdv-kategorisi/${kdvKategorisi.id}`}
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
                        to={`/kdv-kategorisi/${kdvKategorisi.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
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
                          (globalThis.location.href = `/kdv-kategorisi/${kdvKategorisi.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
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
              <Translate contentKey="koopApp.kdvKategorisi.home.notFound">No Kdv Kategorisis found</Translate>
            </div>
          )
        )}
      </div>
      {totalItems ? (
        <div className={kdvKategorisiList && kdvKategorisiList.length > 0 ? '' : 'd-none'}>
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

export default KdvKategorisi;
