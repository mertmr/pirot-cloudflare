export interface ITenant {
  id?: number;
  tenantName?: string;
}

export const defaultTenant: Readonly<ITenant> = {
  id: 0,
  tenantName: '',
};
