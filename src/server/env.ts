import type { JobDelivery } from './delivery';
import type { PasswordHasher } from './passwords';
export interface Env {
  TENANTS: DurableObjectNamespace;
  PASSWORDS: DurableObjectNamespace<PasswordHasher>;
  DELIVERY: DurableObjectNamespace<JobDelivery>;
  DIRECTORY: D1Database;
  FILES?: R2Bucket;
  JOBS?: Queue;
  EMAIL?: {
    send(message: {
      to: string;
      from: string;
      subject: string;
      html?: string;
      text?: string;
      attachments?: { content: string; filename: string; type: string; disposition: 'attachment' }[];
    }): Promise<unknown>;
  };
  AUTH_SECRET: string;
  ENVIRONMENT: string;
  PUBLIC_URL: string;
  EMAIL_FROM?: string;
  EMAIL_ENABLED?: string;
  BUSINESS_STORAGE?: string;
  BOOTSTRAP_SECRET?: string;
}
export interface CurrentUser {
  id: number;
  login: string;
  tenantId: number;
  authorities: string[];
  firstName?: string;
  lastName?: string;
  email?: string;
  langKey?: string;
}
