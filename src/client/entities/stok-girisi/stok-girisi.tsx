import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { JhiItemCount, JhiPagination, TextFormat, Translate, getPaginationState } from 'react-jhipster';
import { Link, useLocation, useNavigate } from 'app/shared/routing/navigation';

import { faSearch, faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';

import { getEntities, getSearchEntities } from './stok-girisi.reducer';

export const StokGirisi = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id', DESC), pageLocation.search),
  );
  const [search, setSearch] = useState('');

  const stokGirisiList = useAppSelector(state => state.stokGirisi.entities);
  const loading = useAppSelector(state => state.stokGirisi.loading);
  const totalItems = useAppSelector(state => state.stokGirisi.totalItems);

  const getAllEntities = () => {
    if (search && search !== '') {
      dispatch(
        getSearchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }),
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }),
      );
    }
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

  const handleSearch = event => setSearch(event.target.value);

  const startSearching = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (paginationState.activePage === 1) {
      getAllEntities();
    } else {
      setPaginationState({ ...paginationState, activePage: 1 });
    }
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
      <h2 id="stok-girisi-heading" data-cy="StokGirisiHeading">
        <Translate contentKey="koopApp.stokGirisi.home.title">Stok Girisis</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" variant="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="koopApp.stokGirisi.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/stok-girisi/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="koopApp.stokGirisi.home.createLabel">Create new Stok Girisi</Translate>
          </Link>
        </div>
      </h2>
      <Form className="d-flex justify-content-end mb-2" onSubmit={startSearching}>
        <input
          name="search"
          value={search}
          onChange={handleSearch}
          placeholder="Ürün Adına Göre Ara"
          className="form-control me-2"
          style={{ maxWidth: '320px' }}
        />
        <Button variant="primary" type="submit">
          <FontAwesomeIcon icon={faSearch} /> Ara
        </Button>
      </Form>
      <div className="table-responsive">
        {stokGirisiList?.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="koopApp.stokGirisi.id">ID</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('miktar')}>
                  <Translate contentKey="koopApp.stokGirisi.miktar">Miktar</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('miktar')} />
                </th>
                <th className="hand" onClick={sort('agirlik')}>
                  <Translate contentKey="koopApp.stokGirisi.agirlik">Agirlik</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('agirlik')} />
                </th>
                <th className="hand" onClick={sort('notlar')}>
                  <Translate contentKey="koopApp.stokGirisi.notlar">Notlar</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('notlar')} />
                </th>
                <th className="hand" onClick={sort('stokHareketiTipi')}>
                  <Translate contentKey="koopApp.stokGirisi.stokHareketiTipi">Stok Hareketi Tipi</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('stokHareketiTipi')} />
                </th>
                <th className="hand" onClick={sort('tarih')}>
                  <Translate contentKey="koopApp.stokGirisi.tarih">Tarih</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('tarih')} />
                </th>
                <th>
                  <Translate contentKey="koopApp.stokGirisi.user">User</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th>
                  <Translate contentKey="koopApp.stokGirisi.urun">Urun</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stokGirisiList.map(stokGirisi => (
                <tr key={`entity-${stokGirisi.id}`} data-cy="entityTable">
                  <td>
                    <Button as={Link as any} to={`/stok-girisi/${stokGirisi.id}`} variant="link" size="sm">
                      {stokGirisi.id}
                    </Button>
                  </td>
                  <td>{stokGirisi.miktar}</td>
                  <td>{stokGirisi.agirlik}</td>
                  <td>{stokGirisi.notlar}</td>
                  <td>
                    <Translate contentKey={`koopApp.StokHareketiTipi.${stokGirisi.stokHareketiTipi}`} />
                  </td>
                  <td>{stokGirisi.tarih ? <TextFormat type="date" value={stokGirisi.tarih} format={APP_DATE_FORMAT} /> : null}</td>
                  <td>{stokGirisi.user ? (typeof stokGirisi.user === 'string' ? stokGirisi.user : stokGirisi.user.login) : ''}</td>
                  <td>
                    {stokGirisi.urunAdi || stokGirisi.urun?.urunAdi ? (
                      <Link to={`/stok-girisi/${stokGirisi.id}`}>{stokGirisi.urunAdi ?? stokGirisi.urun?.urunAdi}</Link>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button as={Link as any} to={`/stok-girisi/${stokGirisi.id}`} variant="info" size="sm" data-cy="entityDetailsButton">
                        <FontAwesomeIcon icon="eye" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.view">View</Translate>
                        </span>
                      </Button>
                      <Button
                        as={Link as any}
                        to={`/stok-girisi/${stokGirisi.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
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
                          (globalThis.location.href = `/stok-girisi/${stokGirisi.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
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
              <Translate contentKey="koopApp.stokGirisi.home.notFound">No Stok Girisis found</Translate>
            </div>
          )
        )}
      </div>
      {totalItems ? (
        <div className={stokGirisiList && stokGirisiList.length > 0 ? '' : 'd-none'}>
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

export default StokGirisi;
