export class Router {
  constructor() { this.routes = []; }
  add(method, pattern, handler) {
    const keys = [];
    const regex = new RegExp('^' + pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => { keys.push(key); return '([^/]+)'; }) + '/?$');
    this.routes.push({ method, regex, keys, handler });
    return this;
  }
  get(p, h) { return this.add('GET', p, h); }
  post(p, h) { return this.add('POST', p, h); }
  delete(p, h) { return this.add('DELETE', p, h); }
  async handle(req, res, ctx) {
    const url = new URL(req.url, 'http://localhost');
    for (const route of this.routes) {
      if (route.method !== req.method) continue;
      const match = route.regex.exec(url.pathname);
      if (!match) continue;
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
      return route.handler({ req, res, params, query: Object.fromEntries(url.searchParams), ...ctx });
    }
    return false;
  }
}
