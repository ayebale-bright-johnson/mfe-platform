import { FederationLoadError } from './errors';

interface LoadRemoteModuleOpts {
  remoteUrl: string;
  scope: string;
  module: string;
  timeout?: number;
}

declare global {
  var __webpack_init_sharing__: ((scope: string) => Promise<void>) | undefined;
  var __webpack_share_scopes__: Record<string, unknown> | undefined;

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Window { [key: string]: unknown }
}

function loadScript(url: string, timeout: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;

    const timer = setTimeout(() => {
      reject(new Error(`Script load timed out after ${String(timeout)}ms: ${url}`));
      script.remove();
    }, timeout);

    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load script: ${url}`));
      script.remove();
    };

    document.head.appendChild(script);
  });
}

export async function loadRemoteModule<T = unknown>(opts: LoadRemoteModuleOpts): Promise<T> {
  const { remoteUrl, scope, module, timeout = 10_000 } = opts;

  try {
    await loadScript(remoteUrl, timeout);
  } catch (cause) {
    throw new FederationLoadError(
      `Failed to load remote script from ${remoteUrl}`,
      { remoteUrl, scope, module, cause },
    );
  }

  const container = window[scope] as {
    init?: (shareScopes: unknown) => Promise<void>;
    get?: (module: string) => Promise<() => T>;
  } | undefined;

  if (!container) {
    throw new FederationLoadError(
      `Remote container "${scope}" not found on window after loading ${remoteUrl}`,
      { remoteUrl, scope, module },
    );
  }

  try {
    if (typeof globalThis.__webpack_init_sharing__ === 'function') {
      await globalThis.__webpack_init_sharing__('default');
    }
    if (container.init && globalThis.__webpack_share_scopes__) {
      await container.init(globalThis.__webpack_share_scopes__['default'] ?? {});
    }
  } catch (cause) {
    throw new FederationLoadError(
      `Failed to initialize remote container "${scope}"`,
      { remoteUrl, scope, module, cause },
    );
  }

  if (typeof container.get !== 'function') {
    throw new FederationLoadError(
      `Remote container "${scope}" does not expose a "get" method`,
      { remoteUrl, scope, module },
    );
  }

  try {
    const factory = await container.get(module);
    return factory();
  } catch (cause) {
    throw new FederationLoadError(
      `Failed to load module "${module}" from remote "${scope}"`,
      { remoteUrl, scope, module, cause },
    );
  }
}
