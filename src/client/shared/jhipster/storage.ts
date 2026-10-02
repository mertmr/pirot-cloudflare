type StorageApi = {
  get: (key: string, defaultValue?: unknown) => any;
  set: (key: string, value: unknown) => void;
  remove: (key: string) => void;
};

const createStorageApi = (getStorage: () => globalThis.Storage): StorageApi => ({
  get(key, defaultValue) {
    const value = getStorage().getItem(key);
    if (!value || value === 'undefined') return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  set: (key, value) => getStorage().setItem(key, JSON.stringify(value)),
  remove: key => getStorage().removeItem(key),
});

// Keep the small react-jhipster-compatible API without importing its
// CommonJS storage module into Vite's native-ESM development graph.
export const Storage = {
  session: createStorageApi(() => window.sessionStorage),
  local: createStorageApi(() => window.localStorage),
};
