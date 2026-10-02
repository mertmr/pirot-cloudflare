import { BusinessError } from './value';
export const MAX_REQUEST_BYTES = 2_000_000;
// Count streamed bytes before JSON parsing; Content-Length alone is not authoritative.
export async function readRequestText(request: Request): Promise<string> {
  if (!request.body) return '';
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > MAX_REQUEST_BYTES) {
    await request.body.cancel();
    throw new BusinessError('invalidrequest', 413);
  }
  const reader = request.body.getReader(),
    decoder = new TextDecoder(),
    parts: string[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new BusinessError('invalidrequest', 413);
      }
      parts.push(decoder.decode(chunk.value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join('');
  } finally {
    reader.releaseLock();
  }
}
export async function boundRequestBody(request: Request): Promise<Request> {
  if (['GET', 'HEAD'].includes(request.method) || !request.body) return request;
  return new Request(request, { body: await readRequestText(request) });
}
