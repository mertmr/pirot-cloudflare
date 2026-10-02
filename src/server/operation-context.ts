import { AsyncLocalStorage } from 'node:async_hooks';
interface Context {
  at: number;
  ids: string[];
  index: number;
}
const contexts = new AsyncLocalStorage<Context>();
export function operationContext() {
  return { at: Date.now(), ids: [] as string[], index: 0 };
}
export function replayOperation<T>(context: Context, callback: () => T): T {
  context.index = 0;
  return contexts.run(context, callback);
}
export function operationDate(): Date {
  return new Date(contexts.getStore()?.at ?? Date.now());
}
export function operationId(): string {
  const context = contexts.getStore();
  if (!context) return crypto.randomUUID();
  const index = context.index++;
  return context.ids[index] ?? (context.ids[index] = crypto.randomUUID());
}
