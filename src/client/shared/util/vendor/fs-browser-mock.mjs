// Browser mock for the node `fs` builtin. node-stdlib-browser ships `null`
// for `fs`, but postcss (pulled into the graph by sanitize-html → react-jhipster)
// destructures existsSync/readFileSync/realpathSync at import time, which
// crashes the app when the polyfill is null. The mock is never meaningfully
// invoked in the browser (no filesystem), so no-op/false answers are safe.
export const existsSync = () => false;
export const readFileSync = () => '';
export const realpathSync = p => p;
export const writeFileSync = () => {};
export const readdirSync = () => [];
export const mkdirSync = () => {};
export const statSync = () => ({ isFile: () => false, isDirectory: () => false });
export const unlinkSync = () => {};

const fsMock = {
  existsSync,
  readFileSync,
  realpathSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  statSync,
  unlinkSync,
};

export default fsMock;