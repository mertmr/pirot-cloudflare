import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

import { IDashboardReports, defaultValue } from 'app/shared/model/dashboard-reports.model';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

const apiUrl = 'api/dashboard-reports';

export const getDashboardReports = createAsyncThunk(
  'dashboardReports/fetch_reports',
  async () => {
    return axios.get<IDashboardReports>(apiUrl);
  },
  { serializeError: serializeAxiosError },
);

const initialState = {
  loading: false,
  errorMessage: null as string | null,
  entity: defaultValue,
  updateSuccess: false,
};

export type DashboardReportsState = Readonly<typeof initialState>;

const dashboardReportsSlice = createSlice({
  name: 'dashboardReports',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getDashboardReports.pending, state => {
        state.loading = true;
        state.errorMessage = null;
        state.updateSuccess = false;
      })
      .addCase(getDashboardReports.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(getDashboardReports.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.error.message ?? null;
      });
  },
});

export default dashboardReportsSlice.reducer;
