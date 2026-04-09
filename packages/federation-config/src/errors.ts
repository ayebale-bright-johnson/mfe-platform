export class FederationLoadError extends Error {
  public readonly remoteUrl: string;
  public readonly scope: string;
  public readonly moduleName: string;

  constructor(
    message: string,
    opts: { remoteUrl: string; scope: string; module: string; cause?: unknown },
  ) {
    super(message, { cause: opts.cause });
    this.name = 'FederationLoadError';
    this.remoteUrl = opts.remoteUrl;
    this.scope = opts.scope;
    this.moduleName = opts.module;
  }
}
