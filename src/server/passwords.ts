import { DurableObject } from 'cloudflare:workers';
import bcrypt from 'bcryptjs';
import type { Env } from './env';
import { BusinessError } from './value';

// Password work runs through a private binding under the Durable Object CPU allowance.
// This object stores no passwords, hashes or authentication state.
export class PasswordHasher extends DurableObject<Env> {
  async hash(password: string): Promise<string> {
    this.validate(password);
    return bcrypt.hash(password, 10);
  }
  async verify(password: string, hash: string): Promise<boolean> {
    if (typeof password !== 'string' || password.length > 200) return false;
    if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) return false;
    return bcrypt.compare(password, hash);
  }
  private validate(password: string) {
    if (typeof password !== 'string' || password.length > 200) throw new BusinessError('invalidrequest');
  }
}
function executor(env: Env) {
  const shard = crypto.getRandomValues(new Uint8Array(1))[0] % 32;
  return env.PASSWORDS.get(env.PASSWORDS.idFromName(`password-work:${shard}`));
}
export function hashPassword(env: Env, password: string) {
  return executor(env).hash(password);
}
export function verifyPassword(env: Env, password: string, hash: string) {
  return executor(env).verify(password, hash);
}
