import { loadIcons } from './config/icon-loader';

loadIcons();

Object.assign(globalThis as any, {
  IS_REACT_ACT_ENVIRONMENT: true,
  SERVER_API_URL: '',
  VERSION: '0.0.1-test',
  DEVELOPMENT: false,
});

if (!(globalThis as any)._virtualConsole) {
  (globalThis as any)._virtualConsole = { emit: () => false };
}

// react-jhipster's `Storage` helper reads window.localStorage/sessionStorage.
// Port the legacy test storage mock so reducer/action specs are hermetic and
// deterministic regardless of the DOM environment.
const storageMock = () => {
  let storage: Record<string, string> = {};
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
    },
    setItem(key: string, value: string) {
      storage[key] = String(value);
    },
    removeItem(key: string) {
      delete storage[key];
    },
    clear() {
      storage = {};
    },
    key() {
      return null;
    },
    get length() {
      return Object.keys(storage).length;
    },
  };
};

Object.defineProperty(window, 'localStorage', {
  value: storageMock(),
  configurable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: storageMock(),
  configurable: true,
});
