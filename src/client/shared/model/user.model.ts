export interface IUser {
  id?: number;
  tenantId?: number | null;
  login?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  activated?: boolean;
  langKey?: string;
  authorities?: string[];
  createdBy?: string;
  createdDate?: string | null;
  lastModifiedBy?: string;
  lastModifiedDate?: string | null;
  password?: string;
}

export const defaultValue: Readonly<IUser> = {
  login: '',
  firstName: '',
  lastName: '',
  email: '',
  activated: true,
  langKey: '',
  authorities: [],
  createdBy: '',
  createdDate: null,
  lastModifiedBy: '',
  lastModifiedDate: null,
  password: '',
};
