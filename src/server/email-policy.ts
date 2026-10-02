import type { Env } from './env';
import { BusinessError } from './value';
export function outboundEmailEnabled(env: Env): boolean {
  return env.EMAIL_ENABLED !== 'false' && (env.ENVIRONMENT === 'development' || env.EMAIL_ENABLED === 'true') && !!env.EMAIL_FROM;
}
export function requireOutboundEmail(env: Env) {
  if (!outboundEmailEnabled(env)) throw new BusinessError('emailunavailable', 503);
}
