/**
 * Cliente Azure DevOps SOMENTE LEITURA.
 * Só existe o método GET: não há como escrever, editar, clonar ou apagar por aqui.
 */
export interface AzureConfig {
  baseUrl?: string;
  organization: string;
  project: string;
  pat: string;
  apiVersion?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export type Scope = 'project' | 'organization';
export type QueryValue = string | number | boolean | undefined;

export interface GetOptions {
  scope?: Scope;
  query?: Record<string, QueryValue>;
}

export interface GetResult<T> {
  data: T;
  continuationToken?: string;
}

export class AzureApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    message: string,
  ) {
    super(message);
    this.name = 'AzureApiError';
  }
}

const STATUS_HINTS: Record<number, string> = {
  401: 'PAT inválido, expirado ou sem acesso à organização',
  403: 'sem permissão/escopo suficiente para este recurso',
  404: 'não encontrado (confira organização, projeto e IDs)',
};

export class AzureReadOnlyClient {
  private readonly baseUrl: string;
  private readonly organization: string;
  private readonly project: string;
  private readonly apiVersion: string;
  private readonly timeoutMs: number;
  private readonly authorization: string;
  private readonly fetchImpl: typeof fetch;

  constructor(cfg: AzureConfig) {
    if (!cfg.organization || !cfg.project || !cfg.pat) {
      throw new Error('Informe organização, projeto e PAT.');
    }
    this.baseUrl = (cfg.baseUrl ?? 'https://dev.azure.com').replace(/\/+$/, '');
    this.organization = cfg.organization;
    this.project = cfg.project;
    this.apiVersion = cfg.apiVersion ?? '7.1';
    this.timeoutMs = cfg.timeoutMs ?? 30_000;
    this.authorization = `Basic ${Buffer.from(`:${cfg.pat}`).toString('base64')}`;
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  buildUrl(resource: string, opts: GetOptions = {}): string {
    const scope = opts.scope ?? 'project';
    const prefix =
      scope === 'project'
        ? `${this.baseUrl}/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}`
        : `${this.baseUrl}/${encodeURIComponent(this.organization)}`;
    const url = new URL(`${prefix}/_apis/${resource.replace(/^\/+/, '')}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    url.searchParams.set('api-version', this.apiVersion);
    return url.toString();
  }

  async get<T = unknown>(resource: string, opts: GetOptions = {}): Promise<GetResult<T>> {
    const endpoint = `${opts.scope ?? 'project'}:${resource}`;
    let res: Response;
    try {
      res = await this.fetchImpl(this.buildUrl(resource, opts), {
        method: 'GET',
        headers: { Authorization: this.authorization, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      throw new AzureApiError(0, endpoint, `Falha de rede em ${endpoint}: ${(e as Error).name}`);
    }
    if (!res.ok) {
      throw new AzureApiError(
        res.status,
        endpoint,
        `HTTP ${res.status} em ${endpoint}: ${STATUS_HINTS[res.status] ?? res.statusText}`,
      );
    }
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('json')) {
      throw new AzureApiError(
        res.status,
        endpoint,
        `Resposta não-JSON em ${endpoint} (possível PAT inválido ou URL/organização incorretas)`,
      );
    }
    const token = res.headers.get('x-ms-continuationtoken') ?? undefined;
    return { data: (await res.json()) as T, continuationToken: token };
  }

  /** Segue x-ms-continuationtoken; junta arrays `value` de cada página. */
  async getPaged(resource: string, opts: GetOptions = {}): Promise<unknown[]> {
    const items: unknown[] = [];
    let token: string | undefined;
    for (let page = 0; page < 200; page++) {
      const { data, continuationToken } = await this.get<{ value?: unknown[] }>(resource, {
        ...opts,
        query: { ...opts.query, continuationToken: token },
      });
      if (Array.isArray(data?.value)) items.push(...data.value);
      else items.push(data);
      if (!continuationToken) break;
      token = continuationToken;
    }
    return items;
  }
}
