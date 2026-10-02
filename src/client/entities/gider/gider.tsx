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

import { getEntities, getSearchEntities } from './gider.reducer';

export const Gider = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id'), pageLocation.search),
  );
  const [search, setSearch] = useState('');

  const giderList = useAppSelector(state => state.gider.entities);
  const loading = useAppSelector(state => state.gider.loading);
  const totalItems = useAppSelector(state => state.gider.totalItems);

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
      <h2 id="gider-heading" data-cy="GiderHeading">
        <Translate contentKey="koopApp.gider.home.title">Giders</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" variant="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="koopApp.gider.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/gider/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="koopApp.gider.home.createLabel">Create new Gider</Translate>
          </Link>
        </div>
      </h2>
      <Form className="d-flex justify-content-end mb-2" onSubmit={startSearching}>
        <input
          name="search"
          value={search}
          onChange={handleSearch}
          placeholder="Kullanıcıya Göre Gider Ara"
          className="form-control me-2"
          style={{ maxWidth: '320px' }}
          data-cy="giderSearchInput"
        />
        <Button variant="primary" type="submit">
          <FontAwesomeIcon icon={faSearch} /> Ara
        </Button>
      </Form>
      <div className="table-responsive">
        {giderList?.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="koopApp.gider.id">ID</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('tarih')}>
                  <Translate contentKey="koopApp.gider.tarih">Tarih</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('tarih')} />
                </th>
                <th className="hand" onClick={sort('tutar')}>
                  <Translate contentKey="koopApp.gider.tutar">Tutar</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('tutar')} />
                </th>
                <th className="hand" onClick={sort('notlar')}>
                  <Translate contentKey="koopApp.gider.notlar">Notlar</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('notlar')} />
                </th>
                <th className="hand" onClick={sort('giderTipi')}>
                  <Translate contentKey="koopApp.gider.giderTipi">Gider Tipi</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('giderTipi')} />
                </th>
                <th className="hand" onClick={sort('odemeAraci')}>
                  <Translate contentKey="koopApp.gider.odemeAraci">Odeme Araci</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('odemeAraci')} />
                </th>
                <th>
                  <Translate contentKey="koopApp.gider.user">User</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {giderList.map(gider => (
                <tr key={`entity-${gider.id}`} data-cy="entityTable">
                  <td>
                    <Button as={Link as any} to={`/gider/${gider.id}`} variant="link" size="sm">
                      {gider.id}
                    </Button>
                    {gider.iptal && <Translate contentKey="correction.cancelled" />}
                    {gider.duzeltildi && <Translate contentKey="correction.corrected" />}
                  </td>
                  <td>{gider.tarih ? <TextFormat type="date" value={gider.tarih} format={APP_DATE_FORMAT} /> : null}</td>
                  <td>{gider.tutar}</td>
                  <td>{gider.notlar}</td>
                  <td>
                    <Translate contentKey={`koopApp.GiderTipi.${gider.giderTipi}`} />
                  </td>
                  <td>
                    <Translate contentKey={`koopApp.OdemeAraci.${gider.odemeAraci}`} />
                  </td>
                  <td>{gider.user ? gider.user.login : ''}</td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button as={Link as any} to={`/gider/${gider.id}`} variant="info" size="sm" data-cy="entityDetailsButton">
                        <FontAwesomeIcon icon="eye" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.view">View</Translate>
                        </span>
                      </Button>
                      <Button
                        as={Link as any}
                        to={`/gider/${gider.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        variant="primary"
                        size="sm"
                        data-cy="entityEditButton"
                        aria-disabled={gider.iptal}
                      >
                        <FontAwesomeIcon icon="pencil-alt" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="correction.editAction">Edit / correct</Translate>
                        </span>
                      </Button>
                      <Button
                        onClick={() =>
                          (globalThis.location.href = `/gider/${gider.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
                        }
                        variant="danger"
                        size="sm"
                        data-cy="entityDeleteButton"
                      >
                        <FontAwesomeIcon icon="trash" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="correction.deleteAction">Delete / cancel</Translate>
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
              <Translate contentKey="koopApp.gider.home.notFound">No Giders found</Translate>
            </div>
          )
        )}
      </div>
      {totalItems ? (
        <div className={giderList && giderList.length > 0 ? '' : 'd-none'}>
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

export default Gider;
