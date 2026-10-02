import axios from 'axios';
import { ICorrectionContext, INobetDuzeltme } from 'app/shared/model/nobet-duzeltme.model';
const url = 'api/nobet-duzeltmeler';
export const correctionContext = (type: string, id: string | number) =>
  axios.get<ICorrectionContext>(`${url}/context/${type}/${id}`).then(r => r.data);
export const shiftCorrections = (id: string | number) => axios.get<INobetDuzeltme[]>(`${url}/nobet/${id}`).then(r => r.data);
export const settleCorrection = (id: number) => axios.post<INobetDuzeltme>(`${url}/${id}/odeme`).then(r => r.data);
