// Browser shim for `source-map-js`.
//
// postcss (a dependency of sanitize-html, pulled in by react-jhipster's
// translate helper) requires SourceMapConsumer/SourceMapGenerator for CSS
// source-map handling. sanitize-html never parses or generates CSS source maps
// in the browser, so no-op stubs keep the module from being externalized by
// Vite (which otherwise logs a console warning on every access) without any
// behavioral change.

export class SourceMapConsumer {
  constructor() {}
  static initialize() {}
  static with() {}
  destroy() {}
}

export class SourceMapGenerator {
  constructor() {}
  toString() {
    return '';
  }
  toJSON() {
    return {};
  }
}

export default { SourceMapConsumer, SourceMapGenerator };
