import type { Plugin } from 'vite';

export function federation(_options: Record<string, unknown>): Plugin[] {
  return [{ name: 'mock-module-federation' } as Plugin];
}
