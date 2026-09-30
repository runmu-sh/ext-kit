/**
 * The world-module runtime shared by ext-tickets, ext-assist and ext-puppets (06-world-modules §1,
 * R-MOD-CORE): the per-world `enabled` (off | auto | on) and `source` (gmcp | api | both) settings,
 * staff role, the Views entry and R-AUTO-PANELS, the Core.Supports handshake, configurable actions
 * (command | gmcp | ext | none) with extension overrides, data requests, read marks for "new" items,
 * and the payload validator. Bundled into each extension; not a package of its own.
 */
import type { Dispose, Mu, SettingSpec } from '@muclient/sdk';
import { validate, type Schema } from './schema.js';

export type Mode = 'off' | 'auto' | 'on';
export type Source = 'gmcp' | 'api' | 'both';
export type Via = 'command' | 'gmcp' | 'ext' | 'none';
export interface ActionDef { label: string; via: Via; cmd: string }
export interface ActionConfig { via?: Via; cmd?: string }
/** What an action handler gets: the session the button was pressed in. */
export interface ActionSession { sid: string; worldId: string; character: string; send(cmd: string): Promise<void>; gmcp(pkg: string, data?: unknown): Promise<boolean> }
export type ActionHandler<A = Record<string, unknown>> = (args: A, s: ActionSession) => boolean | void | Promise<boolean | void>;

export interface ModuleDef {
  /** Settings/API key: 'tickets', 'mytickets', 'assist', 'puppets'. */
  key: string;
  title: string;
  /** Panel ids this module owns (the first is the main one). */
  panels: string[];
  /** GMCP namespace, e.g. 'Client.Tickets' (Core.Supports sends `<pkg> 1`). */
  pkg: string;
  /** Staff views stay out of Views until the role is staff. */
  staff?: boolean;
  actions: Record<string, ActionDef>;
  /** How a `gmcp` action is sent: [package, payload]. */
  gmcpAction(action: string, vars: Record<string, string>): [string, unknown];
  options?: SettingSpec[];
  /** Default enabled mode once the extension is on in a world. */
  defaultMode?: Mode;
}

const VIA_OPTS = [{ value: 'command', label: 'command' }, { value: 'gmcp', label: 'gmcp' }, { value: 'ext', label: 'extension' }, { value: 'none', label: 'hidden' }];
const MODE_OPTS = [{ value: 'off', label: 'off' }, { value: 'auto', label: 'auto' }, { value: 'on', label: 'on' }];
const SOURCE_OPTS = [{ value: 'both', label: 'gmcp + api' }, { value: 'gmcp', label: 'gmcp' }, { value: 'api', label: 'api' }];

/**
 * Fill a command template. `{name}` is replaced; a `[...]` segment is kept only when every placeholder
 * in it is non-empty, so `@approve {short_id}[ = {text}]` covers both of Underspire's forms.
 */
export function fillTemplate(tpl: string, vars: Record<string, string | undefined>): string {
  const sub = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return sub(tpl.replace(/\[([^\]]*)\]/g, (_, seg: string) => ([...seg.matchAll(/\{(\w+)\}/g)].every((m) => (vars[m[1]] ?? '') !== '') ? seg : ''))).trim();
}

/** One Core.Supports registration per package, shared by the modules of an extension (Tickets + My tickets). */
const supportsByMu = new WeakMap<Mu, Map<string, { n: number; off: Dispose }>>();
function holdSupports(mu: Mu, pkg: string): Dispose {
  let supportsRefs = supportsByMu.get(mu);
  if (!supportsRefs) supportsByMu.set(mu, (supportsRefs = new Map()));
  let r = supportsRefs.get(pkg);
  if (!r) { r = { n: 0, off: mu.gmcp.supports([`${pkg} 1`]) }; supportsRefs.set(pkg, r); }
  r.n++;
  let done = false;
  return () => { if (done) return; done = true; if (--r!.n === 0) { supportsRefs!.delete(pkg); r!.off(); } };
}

export class WorldModule {
  readonly def: ModuleDef;
  private mu: Mu;
  private handlers = new Map<string, Set<ActionHandler<any>>>();
  private requests = new Map<string, Set<ActionHandler<any>>>();
  /** Sessions where data has arrived (auto mode) and where the role is staff. */
  readonly seenData = new Set<string>();
  readonly staffIn = new Set<string>();
  private listeners = new Set<() => void>();
  private supportsOff: Dispose | null = null;

  constructor(mu: Mu, def: ModuleDef) { this.mu = mu; this.def = def; }

  /** Setting rows for this module (the extension defines all its modules' rows in one page). */
  settingItems(): SettingSpec[] {
    const k = this.def.key, g = this.def.title;
    const rows: SettingSpec[] = [
      { key: `${k}.enabled`, label: 'Show panel', default: this.def.defaultMode ?? 'auto', kind: 'select', options: MODE_OPTS, group: g, hint: 'auto: appears when the game first sends it', scope: 'world' },
      { key: `${k}.source`, label: 'Driven by', default: 'both', kind: 'select', options: SOURCE_OPTS, group: g, scope: 'world' },
      ...(this.def.options ?? []).map((o) => ({ ...o, key: `${k}.${o.key}`, group: o.group ?? g })),
    ];
    for (const [a, d] of Object.entries(this.def.actions)) {
      rows.push({ key: `${k}.action.${a}.via`, label: `${d.label}: via`, default: d.via, kind: 'select', options: VIA_OPTS, group: `${g} actions`, scope: 'both' });
      rows.push({ key: `${k}.action.${a}.cmd`, label: `${d.label}: command`, default: d.cmd, kind: 'text', group: `${g} actions`, scope: 'both' });
    }
    return rows;
  }

  worldOf(sid: string | null | undefined): string | null {
    if (!sid) return null;
    return this.mu.sessions.list().find((s) => s.id === sid)?.worldId ?? null;
  }
  private get<T>(key: string, worldId: string | null): T { return this.mu.settings.get<T>(`${this.def.key}.${key}`, worldId); }
  mode(worldId: string | null = this.mu.sessions.active()?.worldId ?? null): Mode { return this.get<Mode>('enabled', worldId); }
  source(worldId: string | null): Source { return this.get<Source>('source', worldId); }
  option<T>(key: string, sid?: string | null): T { return this.get<T>(key, sid ? this.worldOf(sid) : (this.mu.sessions.active()?.worldId ?? null)); }
  action(name: string, worldId: string | null): ActionDef {
    const d = this.def.actions[name];
    if (!d) return { label: name, via: 'none', cmd: '' };
    return { label: d.label, via: this.get<Via>(`action.${name}.via`, worldId) ?? d.via, cmd: this.get<string>(`action.${name}.cmd`, worldId) ?? d.cmd };
  }
  /** A button is hidden when its action's via is `none`. */
  shows(name: string, sid: string | null): boolean { return this.action(name, this.worldOf(sid)).via !== 'none'; }

  /** GMCP for this module on `sid` is taken (not off, not api-only). */
  acceptsGmcp(sid: string): boolean { const w = this.worldOf(sid); return this.mode(w) !== 'off' && this.source(w) !== 'api'; }
  acceptsApi(sid: string): boolean { const w = this.worldOf(sid); return this.mode(w) !== 'off' && this.source(w) !== 'gmcp'; }
  isStaff(sid: string | null): boolean { return !this.def.staff || (!!sid && this.staffIn.has(sid)); }
  setStaff(sid: string, on: boolean) { if (on) this.staffIn.add(sid); else this.staffIn.delete(sid); this.changed(); }

  /** Data arrived for `sid`: auto mode shows the panel and R-AUTO-PANELS adds it once. */
  touched(sid: string) {
    const first = !this.seenData.has(sid);
    this.seenData.add(sid);
    if (first) this.changed();
    const m = this.mode(this.worldOf(sid));
    if (m !== 'off' && this.isStaff(sid)) this.mu.panels.autoAdd(this.def.panels[0], sid);
  }

  /** Whether the main panel belongs in Views for the active session. */
  visible(sid: string | null): boolean {
    const m = this.mode(this.worldOf(sid));
    if (m === 'off' || !this.isStaff(sid)) return false;
    return m === 'on' || (!!sid && this.seenData.has(sid));
  }

  onChange(fn: () => void): Dispose { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  changed() { for (const f of [...this.listeners]) { try { f(); } catch (e) { this.mu.log.error(e); } } }

  /** Keep Views, Core.Supports and open panels in line with the mode and role. Call once from activate. */
  bind(): Dispose[] {
    const sync = () => {
      const sid = this.mu.sessions.active()?.id ?? null;
      const vis = this.visible(sid);
      for (const id of this.def.panels) this.mu.panels.update(id, { inViewsMenu: vis });
      const off = this.mode() === 'off';
      if (off) for (const id of this.def.panels) this.mu.panels.close(id);
      if (!off && !this.supportsOff) this.supportsOff = holdSupports(this.mu, this.def.pkg);
      if (off && this.supportsOff) { this.supportsOff(); this.supportsOff = null; }
    };
    const subs: Dispose[] = [
      this.onChange(sync),
      this.mu.settings.watch(`${this.def.key}.enabled`, () => { sync(); this.changed(); }),
      this.mu.sessions.on('switch', () => sync()),
      () => { if (this.supportsOff) { this.supportsOff(); this.supportsOff = null; } },
    ];
    sync();
    return subs;
  }

  /** `api.onAction(name, fn)`: runs before the configured action; returning true skips it. */
  onAction(name: string, fn: ActionHandler<any>): Dispose {
    const set = this.handlers.get(name) ?? this.handlers.set(name, new Set()).get(name)!;
    set.add(fn);
    return () => set.delete(fn);
  }
  /** `api.onRequest(kind, fn)`: replaces the default GMCP data request for `kind`. */
  onRequest(kind: string, fn: ActionHandler<any>): Dispose {
    const set = this.requests.get(kind) ?? this.requests.set(kind, new Set()).get(kind)!;
    set.add(fn);
    return () => set.delete(fn);
  }

  session(sid: string): ActionSession {
    const name = (this.mu.gmcp.state('Char.Name', sid) as { name?: string } | undefined)?.name
      ?? (this.mu.gmcp.state('Char.Status', sid) as { name?: string } | undefined)?.name ?? '';
    return { sid, worldId: this.worldOf(sid) ?? '', character: String(name), send: (c) => this.mu.sessions.send(c, sid), gmcp: (p, d) => this.mu.gmcp.send(p, d, sid) };
  }

  /**
   * Press a button (06 §1 Actions): extension handlers first (true = handled), then the configured
   * `via`. A `gmcp` action falls back to the command template when the transport cannot send GMCP.
   * Returns what was done, for tests: 'ext' | 'gmcp' | 'command' | 'none'.
   */
  async run(name: string, vars: Record<string, string>, sid: string): Promise<'ext' | 'gmcp' | 'command' | 'none'> {
    const s = this.session(sid);
    for (const fn of [...(this.handlers.get(name) ?? [])]) {
      try { if ((await fn({ action: name, ...vars }, s)) === true) return 'ext'; } catch (e) { this.mu.log.error(`action ${name} handler failed:`, e); }
    }
    const a = this.action(name, this.worldOf(sid));
    if (a.via === 'none' || a.via === 'ext') return 'none';
    if (a.via === 'gmcp') {
      const [pkg, data] = this.def.gmcpAction(name, vars);
      if (await this.mu.gmcp.send(pkg, data, sid)) return 'gmcp';
      if (!a.cmd) return 'none';
    }
    const cmd = fillTemplate(a.cmd, vars);
    if (!cmd) return 'none';
    await this.mu.sessions.send(cmd, sid);
    return 'command';
  }

  /** A data request (History, bug detail, Resync…): handlers replace the default GMCP request. */
  async request(kind: string, pkg: string, data: unknown, sid: string): Promise<void> {
    const hs = [...(this.requests.get(kind) ?? [])];
    if (hs.length) { for (const fn of hs) { try { await fn(data as Record<string, unknown>, this.session(sid)); } catch (e) { this.mu.log.error(`request ${kind} handler failed:`, e); } } return; }
    if (this.source(this.worldOf(sid)) !== 'api') await this.mu.gmcp.send(pkg, data, sid);
  }

  /**
   * Check a payload. A malformed one is dropped with one `session.error` line in the session (shown in
   * Session info) and no crash (06 §8).
   */
  check(sid: string, pkg: string, schema: Schema, data: unknown): boolean {
    const err = validate(schema, data);
    if (!err) return true;
    this.mu.sessions.echo(`session.error: ${pkg} rejected by ${this.def.title}: ${err}`, sid);
    this.mu.log.warn(`${pkg} rejected: ${err}`);
    return false;
  }

  // ─── read marks ("new" = an id not seen before on this device, per world) ──────────────────
  private seenKey = () => `seen.${this.def.key}`;
  /** Ids in `ids` not seen before in the session's world; marks them seen. */
  fresh(sid: string, ids: string[]): string[] {
    const store = this.mu.storage.world(this.worldOf(sid));
    const seen = new Set(store.get<string[]>(this.seenKey(), []));
    const out = ids.filter((id) => !seen.has(id));
    if (out.length) store.set(this.seenKey(), [...seen, ...out].slice(-1000));
    return out;
  }

  /** New-item toast (style bible §7, kind label = module). Several new at once become one toast. */
  announce(items: Array<{ title: string; body?: string }>) {
    if (!items.length) return;
    if (items.length > 3) { this.mu.ui.toast(`${items.length} new`, items.slice(0, 3).map((i) => i.title).join(' · '), { kind: this.def.key }); return; }
    for (const i of items) this.mu.ui.toast(i.title, i.body, { kind: this.def.key });
  }

  /** `api.configure(...)`: write actions, options, source, enabled for the active world (or all worlds). */
  configure(cfg: { enabled?: Mode; source?: Source; actions?: Record<string, ActionConfig>; options?: Record<string, unknown> }, worldId?: string | null) {
    const k = this.def.key;
    const set = (key: string, v: unknown) => this.mu.settings.set(`${k}.${key}`, v, worldId);
    if (cfg.enabled) set('enabled', cfg.enabled);
    if (cfg.source) set('source', cfg.source);
    for (const [a, c] of Object.entries(cfg.actions ?? {})) {
      if (!this.def.actions[a]) throw new Error(`${this.def.title}: no action "${a}"`);
      if (c.via) set(`action.${a}.via`, c.via);
      if (c.cmd !== undefined) set(`action.${a}.cmd`, c.cmd);
    }
    for (const [o, v] of Object.entries(cfg.options ?? {})) set(o, v);
    this.changed();
  }
}

/** The GMCP snapshot packages of a module are replayed from `mu.gmcp.state` when it activates (like history.dump.gmcp). */
export function replay(mu: Mu, pkgs: string[], fn: (pkg: string, data: unknown, sid: string) => void) {
  for (const s of mu.sessions.list()) for (const p of pkgs) {
    const d = mu.gmcp.state(p, s.id);
    if (d !== undefined) fn(p, d, s.id);
  }
}
