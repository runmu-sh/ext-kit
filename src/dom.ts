/**
 * Plain-DOM helpers shared by the first-party extensions (bundled into each; not a package of its own).
 * No framework: `h(tag, props, ...children)` builds elements; `sanitize(html)` applies the channel
 * HTML allow-list (R-CHAN) to the `html` fields of module messages.
 */
export type Child = Node | string | number | null | undefined | false | Child[];
type Props = Record<string, unknown> | null | undefined;

export function h(tag: string, props?: Props, ...kids: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'style') el.style.cssText = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'value') (el as HTMLInputElement).value = String(v);
    else if (k === 'checked') (el as HTMLInputElement).checked = !!v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, kids);
  return el;
}

function append(el: Node, kids: Child[]) {
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}

/** Ages like Underspire: `12m`, `3h`, `2d`. */
export function age(mins?: number): string {
  if (mins === undefined || mins === null || !Number.isFinite(+mins)) return '';
  const m = Math.max(0, Math.round(+mins));
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

/** `12:04` from an epoch (s or ms) or ISO string; '' when absent. */
export function clock(ts?: number | string): string {
  if (ts === undefined || ts === null || ts === '') return '';
  const n = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(ts);
  if (!Number.isFinite(n)) return '';
  const d = new Date(n);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ALLOWED = new Set(['B', 'I', 'EM', 'STRONG', 'U', 'S', 'CODE', 'PRE', 'BR', 'P', 'SPAN', 'A', 'UL', 'OL', 'LI', 'BLOCKQUOTE']);
/** Keep only allow-listed tags; drop every attribute except a safe http(s) `href` on links. */
export function sanitize(html: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (n: Node) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 1) {
        const e = c as Element;
        if (!ALLOWED.has(e.tagName)) {
          if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE)$/.test(e.tagName)) { e.remove(); continue; }
          walk(e); e.replaceWith(...e.childNodes); continue;
        }
        for (const a of [...e.attributes]) if (!(e.tagName === 'A' && a.name === 'href' && /^https?:/i.test(a.value))) e.removeAttribute(a.name);
        if (e.tagName === 'A') { e.setAttribute('target', '_blank'); e.setAttribute('rel', 'noopener noreferrer'); }
        walk(e);
      } else if (c.nodeType !== 3) c.remove();
    }
  };
  walk(tpl.content);
  return tpl.content;
}

/** A message body: `text` unless rich text is on and `html` is present (06 §2). */
export function body(m: { text?: string; html?: string }, rich: boolean): Node {
  if (rich && m.html) { const s = h('span'); s.appendChild(sanitize(m.html)); return s; }
  return document.createTextNode(m.text ?? (m.html ? (sanitize(m.html).textContent ?? '') : ''));
}

/** Text with `backtick` spans shown as game commands (the My Tickets empty hint). */
export function hint(text: string): HTMLElement[] {
  return text.split(/(`[^`]+`)/).filter(Boolean).map((p) => (p.startsWith('`') ? h('span', { class: 'cmdref' }, p.slice(1, -1)) : h('span', null, p)));
}

/** Replace the children of `el` keeping focus-free re-renders simple. */
export function fill(el: HTMLElement, ...kids: Child[]) { el.replaceChildren(); append(el, kids); }

/**
 * The `.sh-plate` variant for a status (06 §1a): waiting on staff is hot, waiting on someone is gold,
 * approved is ok, finished is dim; anything else is the plain faint plate.
 */
export function plateOf(status?: string): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'open' || s === 'pending') return 'hot';
  if (s === 'claimed' || s === 'waiting') return 'gold';
  if (s === 'approved') return 'ok';
  if (/^(resolved|closed|denied|withdrawn)$/.test(s)) return 'dim';
  return '';
}
/** The class list of a status plate: `sh-plate` plus its variant and any `extra` classes. */
export const plateCls = (status?: string, ...extra: string[]) => ['sh-plate', plateOf(status), ...extra].filter(Boolean).join(' ');

/**
 * A reply textarea: Enter submits its form, Shift+Enter starts a new line (as the single-line input did
 * for Enter). The form's own `onsubmit` does the work.
 */
export function replyArea(props: Record<string, unknown>): HTMLTextAreaElement {
  const ta = h('textarea', { rows: 2, ...props }) as HTMLTextAreaElement;
  ta.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    ta.form?.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  return ta;
}
