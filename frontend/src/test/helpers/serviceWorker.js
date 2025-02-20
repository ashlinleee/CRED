export const setupServiceWorkerMock = () => {
  const swScope = {
    listeners: {},
    caches: new Map(),
    indexedDB: {
      data: new Map(),
      get: (key) => Promise.resolve(swScope.indexedDB.data.get(key)),
      put: (key, value) => {
        swScope.indexedDB.data.set(key, value);
        return Promise.resolve();
      },
      delete: (key) => {
        swScope.indexedDB.data.delete(key);
        return Promise.resolve();
      }
    },
    registration: {
      showNotification: jest.fn(),
      periodicSync: {
        register: jest.fn()
      }
    },
    clients: {
      openWindow: jest.fn(),
      claim: jest.fn()
    }
  };

  // Mock service worker globals
  global.self = {
    ...swScope,
    addEventListener: (event, handler) => {
      swScope.listeners[event] = handler;
    },
    registration: swScope.registration
  };

  // Mock cache API
  global.caches = {
    open: async (name) => {
      if (!swScope.caches.has(name)) {
        swScope.caches.set(name, new Map());
      }
      return {
        put: (request, response) => {
          swScope.caches.get(name).set(request.url, response);
          return Promise.resolve();
        },
        match: (request) => {
          return Promise.resolve(swScope.caches.get(name).get(request.url));
        },
        delete: (request) => {
          return Promise.resolve(swScope.caches.get(name).delete(request.url));
        },
        keys: () => {
          return Promise.resolve(Array.from(swScope.caches.get(name).keys()));
        }
      };
    },
    delete: (name) => {
      return Promise.resolve(swScope.caches.delete(name));
    },
    keys: () => {
      return Promise.resolve(Array.from(swScope.caches.keys()));
    }
  };

  // Mock ExtendableEvent
  global.ExtendableEvent = class ExtendableEvent {
    constructor(type) {
      this.type = type;
      this.promises = [];
    }

    waitUntil(promise) {
      this.promises.push(promise);
    }

    async complete() {
      await Promise.all(this.promises);
    }
  };

  // Mock FetchEvent
  global.FetchEvent = class FetchEvent extends ExtendableEvent {
    constructor(type, init) {
      super(type);
      this.request = init.request;
      this.respondWith = jest.fn();
    }
  };

  // Mock PushEvent
  global.PushEvent = class PushEvent extends ExtendableEvent {
    constructor(type, init) {
      super(type);
      this.data = init.data;
    }
  };

  // Mock SyncEvent
  global.SyncEvent = class SyncEvent extends ExtendableEvent {
    constructor(type, init) {
      super(type);
      this.tag = init.tag;
    }
  };

  // Mock NotificationEvent
  global.NotificationEvent = class NotificationEvent extends ExtendableEvent {
    constructor(type, init) {
      super(type);
      this.notification = init.notification;
    }
  };

  return swScope;
};

export const mockFetch = (responses) => {
  return jest.fn((url) => {
    const response = responses[url];
    if (!response) {
      return Promise.reject(new Error(`No mock response for ${url}`));
    }
    return Promise.resolve({
      ...response,
      clone: () => ({
        ...response,
        json: () => Promise.resolve(response.body)
      }),
      json: () => Promise.resolve(response.body)
    });
  });
};
