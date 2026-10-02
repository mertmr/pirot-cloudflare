import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env';
import { processQueuedJob } from './jobs';
import { object, text, type JsonObject } from './value';

// Queue consumers forward small outbox pointers; report compression stays within the object CPU allowance.
export class JobDelivery extends DurableObject<Env> {
  async run(pointer: JsonObject): Promise<void> {
    await processQueuedJob(object(pointer), this.env);
  }
}
export function deliverQueuedJob(pointer: JsonObject, env: Env): Promise<void> {
  const id = text(pointer.outboxId);
  const shard = Array.from(id).reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) >>> 0, 0) % 32;
  return env.DELIVERY.get(env.DELIVERY.idFromName(`delivery:${shard}`)).run(pointer);
}
