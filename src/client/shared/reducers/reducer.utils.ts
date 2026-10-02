import {
  ActionReducerMapBuilder,
  AsyncThunk,
  SerializedError,
  SliceCaseReducers,
  UnknownAction,
  ValidateSliceCaseReducers,
  createSlice,
} from '@reduxjs/toolkit';
import { AxiosError, isAxiosError } from 'axios';

export type IQueryParams = { query?: string; page?: number; size?: number; sort?: string };

type GenericAsyncThunk = AsyncThunk<unknown, unknown, any>;
export type PendingAction = ReturnType<GenericAsyncThunk['pending']>;
export type RejectedAction = ReturnType<GenericAsyncThunk['rejected']>;
export type FulfilledAction = ReturnType<GenericAsyncThunk['fulfilled']>;

export function isRejectedAction(action: UnknownAction) {
  return action.type.endsWith('/rejected');
}

export function isPendingAction(action: UnknownAction) {
  return action.type.endsWith('/pending');
}

export function isFulfilledAction(action: UnknownAction) {
  return action.type.endsWith('/fulfilled');
}

const commonErrorProperties: (keyof SerializedError)[] = ['name', 'message', 'stack', 'code'];

export const serializeAxiosError = (value: any): AxiosError | SerializedError => {
  if (typeof value === 'object' && value !== null) {
    if (isAxiosError(value)) {
      return value;
    }
    const simpleError: SerializedError = {};
    for (const property of commonErrorProperties) {
      if (typeof value[property] === 'string') {
        simpleError[property] = value[property];
      }
    }

    return simpleError;
  }
  return { message: String(value) };
};

export interface EntityState<T> {
  loading: boolean;
  errorMessage: string | null;
  entities: readonly T[];
  entity: T;
  links?: any;
  updating: boolean;
  totalItems?: number;
  updateSuccess: boolean;
}

export const createEntitySlice = <State extends EntityState<any>, Reducers extends SliceCaseReducers<State> = SliceCaseReducers<State>>({
  name = '',
  initialState,
  reducers,
  extraReducers,
  skipRejectionHandling,
}: {
  name: string;
  initialState: State;
  reducers?: ValidateSliceCaseReducers<State, Reducers>;
  extraReducers?: (builder: ActionReducerMapBuilder<State>) => void;
  skipRejectionHandling?: boolean;
}) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      reset() {
        return initialState;
      },
      ...reducers,
    },
    extraReducers(builder) {
      extraReducers?.(builder);
      if (!skipRejectionHandling) {
        builder.addMatcher(
          (action: UnknownAction): action is RejectedAction => isRejectedAction(action) && action.type.startsWith(`${name}/`),
          (state, action) => {
            state.loading = false;
            state.updating = false;
            state.updateSuccess = false;
            const failure = action.error;
            state.errorMessage =
              failure && typeof failure === 'object' && 'message' in failure && typeof failure.message === 'string'
                ? failure.message
                : 'error.internalerror';
          },
        );
      }
    },
  });
};
