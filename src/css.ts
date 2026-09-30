/**
 * The world-module panel styles (Tickets, My Tickets, Assist, Puppets), restyled on 2026-09-29 to
 * Underspire's terminal look (parity delta #41, 06-world-modules §1a), in our tokens (style bible §2–§7).
 *
 * The controls are the host's primitives from `mu.ui.css` (SDK 1.5), never redefined here:
 * rows are `.sh-row` (▸ marker on hover, focus and `.hot`), statuses `.sh-plate` (hot/gold/ok/dim),
 * buttons `.sh-cmd` (`.primary`, `.warn`), tabs and filters `.sh-toggle`, replies `.sh-field`.
 * This sheet only lays them out and sets the module text: tokens only, radius 0, weights 400/500,
 * 1px rules, 0.12 s colour transitions. Injected with `mu.ui.style`; every rule is under `.mx`.
 */
export const MODULE_CSS = `
.mx { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--bg-elev); color: var(--fg); font-size: 1rem; }
.mx button { font-family: inherit; cursor: pointer; }
.mx button:focus-visible, .mx input:focus-visible, .mx select:focus-visible, .mx textarea:focus-visible { outline: 2px solid var(--accent-bright); outline-offset: -2px; }

/* Header: TITLE, the view toggles, a count or [ BACK ] at the right. */
.mx .hd { display: flex; align-items: center; gap: .6ch; padding: 5px 8px 5px 10px; border-bottom: 1px solid var(--accent); flex: 0 0 auto; min-height: 24px; }
.mx .tag { color: var(--accent-bright); text-transform: uppercase; letter-spacing: .2em; font-size: .74rem; margin-right: 1ch; }
.mx.assist .hd { align-items: baseline; gap: 1ch; padding: 6px 10px; }
.mx.assist .tag { letter-spacing: .22em; font-size: .8rem; margin-right: 0; }
.mx .hd .sub { color: var(--fg-dim); text-transform: uppercase; letter-spacing: .18em; font-size: .62rem; }
.mx .count { margin-left: auto; color: var(--gold); font-size: .66rem; letter-spacing: .1em; }
.mx.assist .count { font-size: .68rem; }
.mx .back { margin-left: auto; }

/* Feedback line after an action: ok, or .err. */
.mx .fb { margin: 0; padding: 4px 10px; font-size: .72rem; letter-spacing: .04em; color: var(--ok); border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.mx .fb.err { color: var(--alert); }

/* Kind filters (Tickets): a wrapping row of .sh-toggle. */
.mx .filters { display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding: 6px 10px; border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.mx .fl { display: flex; flex-wrap: wrap; gap: 2px 6px; }

/* Lists of .sh-row. */
.mx .list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; }
.mx .r1 { display: flex; justify-content: space-between; align-items: baseline; gap: 1ch; min-width: 0; }
.mx.mine .r1 { justify-content: flex-start; }
.mx .kind { color: var(--accent-bright); text-transform: uppercase; letter-spacing: .12em; font-size: .68rem; }
.mx .row[data-kind=bug] .kind { color: var(--alert); }
.mx .row[data-kind=puppet] .kind { color: var(--gold); }
.mx .row[data-kind=report] .kind { color: var(--fg); }
.mx .sid, .mx .id { color: var(--fg-faint); font-size: .62rem; letter-spacing: 0; }
.mx.mine .id { font-size: .64rem; }
.mx .meta { display: flex; align-items: baseline; gap: .8ch; flex: 0 0 auto; }
.mx.assist .meta { gap: .7ch; }
.mx .pri { color: var(--alert); font-size: .62rem; }
.mx .asg { color: var(--fg-dim); font-size: .6rem; letter-spacing: .1em; text-transform: uppercase; }
.mx.assist .asg { color: var(--accent-bright); font-size: .62rem; letter-spacing: .06em; }
.mx .age { color: var(--fg-faint); font-size: .64rem; }
.mx.assist .age { font-size: .68rem; }
.mx.mine .age { margin-left: auto; }
.mx .row .who { color: var(--gold); font-size: .78rem; }
.mx.assist .row .who { text-transform: uppercase; letter-spacing: .08em; }
.mx .subject { color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mx.mine .row.hot .subject { color: var(--gold); }
.mx .prev { color: var(--fg-dim); font-size: .74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mx.mine .prev, .mx.assist .prev { font-size: .76rem; }

/* Empty states: uppercase tracked faint labels (delta #27). Commands in a hint keep their case. */
.mx .empty { color: var(--fg-faint); font-style: normal; padding: 12px 10px; margin: 0; font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; line-height: 1.5; }
.mx.assist .empty { font-size: .66rem; }
.mx .empty .cmdref { color: var(--gold); text-transform: none; letter-spacing: .04em; }
.mx .empty.err { color: var(--alert); }
.mx .empty .sh-cmd { margin-left: 1ch; }

/* A conversation: head, context, messages, reply. */
.mx .convo { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.mx .head { display: flex; align-items: flex-start; gap: 1ch; padding: 7px 10px; border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.mx .who-head { display: flex; align-items: center; gap: 1ch; padding: 5px 10px; border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.mx .petitioner { color: var(--gold); letter-spacing: .04em; font-size: .86rem; }
.mx.assist .petitioner { text-transform: uppercase; letter-spacing: .1em; font-size: .78rem; }
.mx .petitioner .sub { display: flex; flex-wrap: wrap; align-items: center; gap: .8ch; margin-top: 3px; color: var(--fg-dim); font-size: .7rem; letter-spacing: 0; }
.mx .acct { color: var(--fg-faint); }
.mx.assist .petitioner .acct { margin-left: 1ch; text-transform: none; letter-spacing: 0; font-size: .72rem; }
.mx .actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 2px; margin-left: auto; }
.mx .actions .grp { display: inline-flex; gap: 2px; }
.mx .ctx { padding: 6px 10px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; flex: 0 0 auto; }
.mx .cx { font-size: .74rem; }
.mx .ck { color: var(--fg-faint); text-transform: uppercase; font-size: .6rem; letter-spacing: .14em; margin-right: .6ch; }
.mx .cv { color: var(--fg); }
.mx .dim { color: var(--fg-faint); }
.mx .loadbug { align-self: flex-start; margin: 3px 0 0 -.5ch; }
.mx .bug { padding: 6px 10px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 3px; }
.mx .bl { font-size: .74rem; color: var(--fg); }
.mx .tb { margin: 2px 0 4px; padding: 6px; background: var(--bg-deep); border: 0; border-left: 1px solid var(--border-bright); color: var(--fg-dim); font-size: .7rem; max-height: 180px; overflow: auto; white-space: pre-wrap; font-family: inherit; }
.mx .body { flex: 1; min-height: 0; overflow-y: auto; }

/* Messages: a left rule per message; staff messages take the accent rule, notes a dashed one. */
.mx .msgs { padding: 8px 10px; line-height: 1.5; display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 0; overflow-y: auto; }
.mx.mine .msgs { gap: 10px; }
.mx .body .msgs { overflow: visible; flex: none; }
.mx .m { padding-left: 1.5ch; border-left: 1px solid var(--border-bright); font-size: .85rem; }
.mx.mine .m { display: flex; flex-direction: column; gap: 2px; }
.mx .m.staffmsg { border-left-color: var(--accent); }
.mx .m.note { border-left-style: dashed; }
.mx .m .s { color: var(--accent-bright); margin-right: .6ch; text-decoration: none; } /* the terminal palette's global .s is strike-through */
.mx.mine .m .s { margin-right: 0; }
.mx.mine .m.me .s { color: var(--fg-dim); }
.mx .m .who { display: flex; align-items: baseline; gap: .8ch; }
.mx .m .sh-plate { margin-right: .6ch; }
.mx.mine .m .sh-plate { margin-right: 0; }
.mx .m .mts { color: var(--fg-faint); font-size: .64rem; margin-right: .6ch; }
.mx .m .t { display: block; color: var(--fg); white-space: pre-wrap; }
.mx.assist .m { padding-left: 0; border-left: 0; }
.mx.assist .m .t { display: inline; }
.mx .sys { color: var(--fg-faint); font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; padding: 2px 0; }
.mx .sys::before { content: "-- " / ""; }
.mx .m.note .s::after { content: " (note)" / ""; color: var(--alert); font-size: .7em; letter-spacing: .1em; text-transform: uppercase; }

/* Reply: Tickets has the note switch and a bare textarea; My tickets a boxed .sh-field and [ REPLY ]; Assist a > line. */
.mx .reply { display: flex; align-items: center; gap: .8rem; padding: 7px 10px; border-top: 1px solid var(--accent); flex: 0 0 auto; }
.mx.mine .reply { flex-direction: column; align-items: stretch; gap: 4px; }
.mx.assist .reply { gap: .6rem; padding: 6px 10px; }
.mx .int { color: var(--fg-dim); font-size: .6rem; letter-spacing: .14em; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
.mx .reply textarea { flex: 1; min-width: 0; color: var(--fg); font-family: inherit; font-size: .85rem; caret-color: var(--accent-bright); resize: vertical; }
.mx.tickets .reply textarea { background: transparent; border: 0; outline: none; padding: 0; min-height: 0; }
.mx .rkeys { display: flex; gap: 6px; align-items: center; }
.mx .rkeys .send { margin-left: auto; }
.mx .chev { color: var(--accent-bright); }
.mx .reply input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none; color: var(--fg); font: inherit; font-size: .85rem; caret-color: var(--accent-bright); min-height: 24px; }
.mx .closed-note { padding: 7px 10px; border-top: 1px solid var(--border); color: var(--fg-faint); font-size: .64rem; letter-spacing: .14em; text-transform: uppercase; flex: 0 0 auto; }
.mx .chead { display: flex; flex-direction: column; gap: 4px; padding: 7px 10px; border-bottom: 1px solid var(--border); flex: 0 0 auto; }
.mx .ctitle { color: var(--gold); letter-spacing: .04em; font-size: .88rem; }
.mx .cmeta { display: flex; flex-wrap: wrap; align-items: center; gap: 1ch; }
.mx .ckind { color: var(--accent-bright); text-transform: uppercase; letter-spacing: .12em; font-size: .66rem; }
/* A destructive command waiting for its confirming second press. */
.mx .sh-cmd.armed, .mx .sh-cmd.armed:is(:hover, :focus-visible) { background: var(--alert); color: var(--bg-deep); }

/* Puppets: .sh-row rows laid out in a line; the terminal view has a head, feed, scene and input. */
.mx.puppets { overflow: hidden; }
.mx.puppets .row { flex-direction: row; gap: 1ch; align-items: baseline; }
.mx.puppets .row strong, .mx.puppets .term-head strong, .mx.puppets .prompt { color: var(--gold); font-weight: 400; }
.mx.puppets small { color: var(--fg-faint); font-size: .8em; }
.mx.puppets .where { margin-left: auto; color: var(--fg-dim); font-size: .8em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mx.puppets .pbadge { margin-left: 6px; min-width: 1.4em; padding: 0 .5ch; background: var(--gold); color: var(--bg-deep); font-size: .64rem; text-align: center; }
.mx.puppets .term-head { display: flex; gap: 1ch; align-items: center; padding: 5px 8px 5px 10px; border-bottom: 1px solid var(--accent); flex: 0 0 auto; }
.mx.puppets .term-head .tool { flex: none; }
.mx.puppets .term-head .where { max-width: 40%; }
.mx.puppets .term-head .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.mx.puppets .term-feed { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
.mx.puppets .term-line { color: var(--fg); font-size: .9em; white-space: pre-wrap; word-break: break-word; }
.mx.puppets .term-line.self { color: var(--fg-dim); }
.mx.puppets .pscene { border-top: 1px solid var(--border); padding: 4px 10px; font-size: .74rem; color: var(--fg-dim); display: flex; flex-direction: column; gap: 1px; flex: 0 0 auto; }
.mx.puppets .pscene .rn { color: var(--accent-bright); text-transform: uppercase; letter-spacing: .16em; font-size: .7rem; }
.mx.puppets .pscene .lk { color: var(--fg-faint); text-transform: uppercase; letter-spacing: .12em; font-size: .6rem; margin-right: .6ch; }
.mx.puppets .term-input { display: flex; gap: .8ch; align-items: center; padding: 6px 10px; border-top: 1px solid var(--accent); flex: 0 0 auto; }
.mx.puppets .term-input input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none; color: var(--fg); padding: 3px 0; font: inherit; caret-color: var(--accent-bright); min-height: 24px; }
.mx.puppets .sync, .mx.puppets .empty { color: var(--fg-faint); font-size: .64rem; letter-spacing: .14em; text-transform: uppercase; padding: 10px; }
@media (max-width: 420px) { .mx button, .mx .sh-cmd, .mx .sh-toggle { min-height: 32px; } }
`;
