/** Thin GitHub REST client. Injectable fetch for tests; no cloning. */

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface GithubClientOptions {
  token?: string | undefined;
  fetchImpl?: FetchLike;
  baseUrl?: string;
}

export class GithubHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`GitHub API ${status} for ${url}`);
  }
}

export class GithubClient {
  private readonly token: string | undefined;
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;

  constructor(opts: GithubClientOptions = {}) {
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    this.baseUrl = (opts.baseUrl ?? "https://api.github.com").replace(/\/$/, "");
  }

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "agentic-sdlc-audit",
    };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const res = await this.fetchImpl(url, { headers });
    if (!res.ok) throw new GithubHttpError(res.status, url);
    return (await res.json()) as T;
  }

  /** GET returning null on 404/409 (missing resource / empty repo). */
  async getOrNull<T>(path: string): Promise<T | null> {
    try {
      return await this.get<T>(path);
    } catch (err) {
      if (err instanceof GithubHttpError && (err.status === 404 || err.status === 409)) {
        return null;
      }
      throw err;
    }
  }

  /** Follow per_page pagination up to `max` items. */
  async paginate<T>(path: string, max: number): Promise<T[]> {
    const items: T[] = [];
    const perPage = Math.min(100, max);
    let page = 1;
    while (items.length < max) {
      const sep = path.includes("?") ? "&" : "?";
      const batch = await this.get<T[]>(`${path}${sep}per_page=${perPage}&page=${page}`);
      items.push(...batch);
      if (batch.length < perPage) break;
      page += 1;
    }
    return items.slice(0, max);
  }
}
