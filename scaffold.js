/*
 * Scaffold — in-app spec overlay for Agent0-Context-Framework projects.
 *
 * Devtools for your specs: a collapsible pill → drawer that shows the CURRENT
 * page's node from FEATURE_TREE.json, its Invariants (non-negotiables) and
 * Flair (Claude's changeable choices) in an IDE-colored, plain-language editor,
 * plus an all-specs browser and a request queue Claude reads next session.
 *
 * Self-contained, zero-dependency, Shadow-DOM isolated. Served by the host at
 * /__scaffold/scaffold.js (dev-only, env-gated) per .github/skills/scaffolding/SKILL.md.
 * Makes NO network calls except same-origin /__scaffold/* — never calls any AI.
 * Install with /install-scaffold, tear down with /demolish-scaffold.
 */
(() => {
  "use strict";
  if (window.__AGENT0_SCAFFOLD__) return;
  window.__AGENT0_SCAFFOLD__ = 1;

  const BASE = "/__scaffold";
  const LS_OPEN = "a0scaffold.open", LS_TAB = "a0scaffold.tab";

  const S = {
    data: null, err: null,
    open: localStorage.getItem(LS_OPEN) === "1",
    tab: localStorage.getItem(LS_TAB) || "page",
    nodeId: null,           // manual node selection (null = follow the route)
    editInv: false, editFlair: false,
    q: "", qFocus: false,
    toast: null, toastBad: false, toastTimer: 0,
    saving: false,
  };

  /* ---------------- data helpers ---------------- */
  const tree = () => (S.data && S.data.tree) || {};
  const nodes = () => tree().nodes || [];
  const roomsList = () => (tree().rooms || []).slice().sort((a, b) => (a.order || 999) - (b.order || 999));
  const requests = () => (S.data && S.data.requests) || [];
  const editable = () => !!(S.data && S.data.editable);
  let _by = null, _byOf = null;
  function byId() {
    if (_byOf !== nodes()) { _by = {}; nodes().forEach(n => _by[n.id] = n); _byOf = nodes(); }
    return _by;
  }
  const specd = n => !!(n && n.artifacts && n.artifacts.spec);
  const flairOf = n => (n.flair && n.flair.length) ? n.flair
    : [n.summary, n.detail].filter(s => s && s.trim());   // seed view until a real ## Flair exists
  const KIND_ICON = { page: "▢", component: "▣", endpoint: "⇄", service: "⚙", schema: "▤", integration: "↗", feature: "★" };
  const ST_COLOR = { planned: "var(--dim)", "in-progress": "var(--amber)", built: "var(--blue)", verified: "var(--green)" };
  const ACT_COLOR = { cover: "var(--blue)", verify: "var(--green)", spec: "var(--violet)", note: "var(--amber)", "spec-edited": "var(--teal)" };

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const slug = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function timeAgo(ts) {
    const d = Date.now() - new Date(ts).getTime();
    if (!(d >= 0)) return "";
    const m = Math.floor(d / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 48) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }

  /* IDE-ish highlighting: code ticks / keywords / paths / strings / numbers.
     Split on `code` spans first so later passes never touch their contents. */
  function hl(raw) {
    return String(raw == null ? "" : raw).split(/(`[^`]+`)/).map(p => {
      if (p.length > 2 && p.startsWith("`") && p.endsWith("`"))
        return `<span class="c-code">${esc(p.slice(1, -1))}</span>`;
      let t = esc(p);
      t = t.replace(/\b(MUST NOT|MUST NEVER|DO NOT|MUST|NEVER|ALWAYS|ONLY|REQUIRED|CANNOT|SHALL)\b/g, '<span class="c-kw">$1</span>');
      t = t.replace(/(^|[\s(])([\w.-]+\/[\w./-]+|[\w-]+\.(?:jsx?|tsx?|cjs|mjs|css|md|json|sql|py|html))\b/g, '$1<span class="c-str">$2</span>');
      t = t.replace(/'([^'\s]{1,40})'/g, "<span class=\"c-str\">'$1'</span>");
      t = t.replace(/\b(\d+(?:\.\d+)?)(ms|s|px|%|x)?\b/g, '<span class="c-num">$1$2</span>');
      return t;
    }).join("");
  }

  /* ---------------- route → node matching ---------------- */
  function matchNode(path) {
    const map = (S.data && S.data.routes) || {};
    if (map[path] && byId()[map[path]]) return byId()[map[path]];
    const segs = path.toLowerCase().split("/").filter(Boolean).map(slug).filter(Boolean);
    const pslug = segs.join("-");
    let best = null, bs = 0;
    for (const n of nodes()) {
      if (n.kind !== "page" && n.kind !== "component" && n.kind !== "feature") continue;
      const id = n.id.toLowerCase(), t = slug(n.title);
      let s = 0;
      if (pslug && (id === pslug || t === pslug)) s = 90;
      for (const g of segs) {
        if (s >= 90) break;
        if (id === g || t === g) s = Math.max(s, 70);
        else if (g.length > 3 && id.includes(g)) s = Math.max(s, 45);
        else if (id.length > 3 && g.includes(id)) s = Math.max(s, 40);
      }
      if (s < 60 && path !== "/") {
        for (const sf of (n.surfaces || [])) {
          if (typeof sf === "string" && sf.toLowerCase().includes(path.toLowerCase())) { s = Math.max(s, 60); break; }
        }
      }
      if (s < 35) {
        const src = ((n.artifacts && n.artifacts.files && (n.artifacts.files.source || n.artifacts.files.ui)) || "").toLowerCase();
        const base = slug(src.split("/").pop().replace(/\.\w+$/, ""));
        for (const g of segs) if (g.length > 3 && base && (base === g || base.startsWith(g))) s = Math.max(s, 35);
      }
      if (path === "/" && s < 30 && /(^|-)(home|index|landing|dashboard)($|-)/.test(id)) s = 30;
      if (s > bs) { bs = s; best = n; }
    }
    return bs >= 30 ? best : null;
  }
  const cur = () => (S.nodeId && byId()[S.nodeId]) || matchNode(location.pathname);

  /* ---------------- server ---------------- */
  async function jf(path, opts) {
    const r = await fetch(BASE + path, opts);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  const post = (path, body) => jf(path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });

  async function refresh() {
    try { S.data = await jf("/data"); S.err = null; }
    catch (e) { S.err = String((e && e.message) || e); }
  }

  function toast(msg, bad) {
    S.toast = msg; S.toastBad = !!bad;
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => { S.toast = null; render(); }, 4000);
    render();
  }

  async function saveSection(section, items) {
    const n = cur(); if (!n || S.saving) return;
    S.saving = true; render();
    try {
      const res = await post("/save", { node: n.id, section, items });
      S.editInv = S.editFlair = false;
      await refresh();
      // the tree JSON regenerates only at the next /feature-tree — until then,
      // keep showing what was just written to the spec files
      const fresh = byId()[n.id];
      if (fresh && res.mode === "saved") {
        if (section === "invariants") fresh.invariants = items; else fresh.flair = items;
      }
      toast(res.mode === "queued"
        ? "Not spec'd yet — handed to Claude's next session (no AI call made)"
        : "Saved to your repo · flagged for Claude to review next session");
    } catch (e) { toast("Save failed: " + e.message, true); }
    S.saving = false; render();
  }

  async function queueReq(action, note) {
    const n = cur();
    try {
      const res = await post("/request", { action, node: n ? n.id : null, route: location.pathname, note: note || "" });
      if (res.requests) S.data.requests = res.requests;
      toast("Queued for Claude's next session · no AI call was made");
    } catch (e) { toast("Queue failed: " + e.message, true); }
    render();
  }

  async function removeReq(id) {
    try {
      const res = await post("/request", { remove: id });
      if (res.requests) S.data.requests = res.requests;
    } catch (e) { toast("Remove failed: " + e.message, true); }
    render();
  }

  /* ---------------- rendering ---------------- */
  let host, root;

  function css() {
    return `<style>
      :host { all: initial; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .wrap { --bg:#0d1117; --panel:#161b22; --panel2:#1c2129; --border:#30363d; --text:#e6edf3;
        --dim:#8b949e; --red:#ff7b72; --amber:#ffa657; --green:#7ee787; --blue:#79c0ff;
        --violet:#d2a8ff; --teal:#56d4dd;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; color: var(--text); }
      .mono { font-family: ui-monospace, SFMono-Regular, Consolas, Menlo, monospace; }
      .pill { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; display: flex; align-items: center;
        gap: 7px; padding: 8px 13px; border-radius: 999px; background: #161b22ee; color: #e6edf3;
        border: 1px solid #30363d; font: 600 12.5px system-ui, sans-serif; cursor: pointer;
        box-shadow: 0 4px 18px rgba(0,0,0,.45); backdrop-filter: blur(4px); }
      .pill:hover { border-color: #8b949e; }
      .dot { width: 8px; height: 8px; border-radius: 50%; }
      .rbadge { min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: var(--amber);
        color: #0d1117; font-size: 10.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
      .drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 2147482999; width: min(410px, 94vw);
        background: var(--bg); border-left: 1px solid var(--border); display: flex; flex-direction: column;
        box-shadow: -12px 0 40px rgba(0,0,0,.5); animation: slidein .18s ease-out; }
      @keyframes slidein { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
      .hd { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-bottom: 1px solid var(--border);
        background: var(--panel); }
      .hd .ttl { font-weight: 700; font-size: 13.5px; }
      .route { font-size: 11px; color: var(--dim); background: var(--panel2); border: 1px solid var(--border);
        padding: 2px 8px; border-radius: 999px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .x { margin-left: auto; cursor: pointer; color: var(--dim); font-size: 16px; padding: 2px 6px; border-radius: 6px; }
      .x:hover { color: var(--text); background: var(--panel2); }
      .tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--panel); }
      .tab { flex: 1; text-align: center; padding: 8px 4px; font-size: 12px; font-weight: 600; color: var(--dim);
        cursor: pointer; border-bottom: 2px solid transparent; }
      .tab.on { color: var(--text); border-bottom-color: var(--blue); }
      .tab:hover { color: var(--text); }
      .body { flex: 1; overflow-y: auto; padding: 13px 14px 20px; }
      .card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
      .ntitle { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
      .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
      .chip { font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border);
        background: var(--panel2); color: var(--dim); }
      .chip .cd { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; }
      .sum { color: var(--dim); font-size: 12.5px; line-height: 1.5; }
      .meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 9px; font-size: 11.5px; color: var(--dim); }
      .meta b { color: var(--text); font-weight: 600; }
      .deps { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px; }
      .dep { font-size: 10.5px; padding: 2px 7px; border-radius: 6px; background: var(--panel2);
        border: 1px solid var(--border); color: var(--blue); cursor: pointer; }
      .dep:hover { border-color: var(--blue); }
      .acts { display: flex; gap: 6px; margin: 11px 0; }
      .abtn { flex: 1; padding: 7px 4px; border-radius: 8px; border: 1px solid var(--border); background: var(--panel);
        color: var(--text); font: 600 11.5px system-ui, sans-serif; cursor: pointer; }
      .abtn:hover { border-color: var(--dim); background: var(--panel2); }
      .acap { font-size: 10.5px; color: var(--dim); line-height: 1.45; margin: -3px 0 12px; }
      .sec { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 11px; overflow: hidden; }
      .sech { display: flex; align-items: center; gap: 7px; padding: 9px 11px; background: var(--panel); cursor: pointer; }
      .sech .n { font-weight: 700; font-size: 12.5px; }
      .sech .cnt { font-size: 10.5px; color: var(--dim); }
      .sech .ebtn { margin-left: auto; font-size: 11px; font-weight: 600; color: var(--blue); cursor: pointer;
        padding: 2px 8px; border-radius: 6px; }
      .sech .ebtn:hover { background: var(--panel2); }
      .caret { color: var(--dim); font-size: 10px; }
      .secsub { padding: 0 11px 8px; font-size: 11px; color: var(--dim); line-height: 1.45; background: var(--panel); }
      .items { list-style: none; }
      .items li { padding: 7px 11px 7px 13px; font-size: 12px; line-height: 1.5; border-top: 1px solid var(--border); }
      .items.inv li { border-left: 3px solid var(--red); }
      .items.flr li { border-left: 3px solid var(--violet); }
      .items li.empty { color: var(--dim); font-style: italic; border-left-color: var(--border); }
      .c-kw { color: var(--red); font-weight: 700; }
      .c-str { color: var(--green); }
      .c-num { color: var(--amber); }
      .c-code { color: var(--blue); background: #79c0ff14; padding: 0 3px; border-radius: 4px; }
      .ed { padding: 9px 11px; border-top: 1px solid var(--border); }
      .ed textarea { width: 100%; min-height: 110px; background: var(--bg); color: var(--text); border: 1px solid var(--border);
        border-radius: 8px; padding: 8px; font: 12px ui-monospace, Consolas, monospace; line-height: 1.55; resize: vertical; }
      .ed textarea:focus { outline: none; border-color: var(--blue); }
      .edrow { display: flex; gap: 6px; align-items: center; margin-top: 7px; }
      .save { padding: 6px 14px; border-radius: 7px; border: none; background: var(--green); color: #0d1117;
        font: 700 12px system-ui, sans-serif; cursor: pointer; }
      .cancel { padding: 6px 10px; border-radius: 7px; border: 1px solid var(--border); background: none;
        color: var(--dim); font: 600 12px system-ui, sans-serif; cursor: pointer; }
      .edhint { font-size: 10.5px; color: var(--dim); margin-left: auto; text-align: right; }
      .search { width: 100%; padding: 8px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--panel);
        color: var(--text); font: 12.5px system-ui, sans-serif; margin-bottom: 11px; }
      .search:focus { outline: none; border-color: var(--blue); }
      .rgrp { margin-bottom: 4px; }
      .rgh { font-size: 11px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: .04em;
        padding: 8px 2px 4px; }
      .nrow { display: flex; align-items: center; gap: 8px; padding: 6px 9px; border-radius: 8px; cursor: pointer; }
      .nrow:hover { background: var(--panel); }
      .nrow .ki { color: var(--dim); width: 14px; text-align: center; }
      .nrow .nt { flex: 1; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .nrow .tag { font-size: 9.5px; font-weight: 700; color: var(--dim); border: 1px solid var(--border);
        border-radius: 5px; padding: 1px 5px; }
      .nrow .tag.sp { color: var(--green); border-color: #7ee78744; }
      .req { display: flex; gap: 9px; padding: 9px 10px; border: 1px solid var(--border); border-radius: 9px;
        margin-bottom: 7px; background: var(--panel); align-items: flex-start; }
      .req .achip { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--border);
        text-transform: uppercase; letter-spacing: .03em; white-space: nowrap; }
      .req .rb { flex: 1; min-width: 0; }
      .req .rt { font-size: 12px; font-weight: 600; }
      .req .rm { font-size: 10.5px; color: var(--dim); margin-top: 2px; word-break: break-word; }
      .req .del { color: var(--dim); cursor: pointer; padding: 1px 5px; border-radius: 5px; }
      .req .del:hover { color: var(--red); background: var(--panel2); }
      .note { margin-top: 12px; }
      .note textarea { width: 100%; min-height: 64px; background: var(--panel); color: var(--text);
        border: 1px solid var(--border); border-radius: 8px; padding: 8px; font: 12px system-ui, sans-serif; resize: vertical; }
      .empty-tab { color: var(--dim); font-size: 12.5px; text-align: center; padding: 26px 12px; line-height: 1.6; }
      .ft { padding: 7px 14px; border-top: 1px solid var(--border); background: var(--panel); font-size: 10px;
        color: var(--dim); display: flex; gap: 6px; align-items: center; }
      .toast { position: fixed; right: 16px; bottom: 62px; z-index: 2147483001; max-width: 320px; padding: 9px 13px;
        border-radius: 9px; background: var(--panel2); border: 1px solid var(--green); color: var(--text);
        font: 12px system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.5); animation: slidein .15s ease-out; }
      .toast.bad { border-color: var(--red); }
      .errbox { border: 1px solid var(--red); border-radius: 10px; padding: 13px; font-size: 12.5px; line-height: 1.6;
        color: var(--dim); background: var(--panel); }
      .errbox b { color: var(--red); }
      .errbox code { color: var(--blue); font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; }
      .link { color: var(--blue); cursor: pointer; font-weight: 600; }
    </style>`;
  }

  const secState = { inv: true, flair: true };   // collapsed toggles (session-only)

  function nodeCard(n) {
    const v = n.verification;
    const todo = n.todo || {};
    const deps = (n.dependsOn || []).filter(id => byId()[id]);
    return `<div class="card">
      <div class="ntitle">${esc(n.title)}</div>
      <div class="chips">
        <span class="chip"><span class="cd" style="background:${ST_COLOR[n.status] || "var(--dim)"}"></span>${esc(n.status)}</span>
        <span class="chip">${KIND_ICON[n.kind] || ""} ${esc(n.kind)}</span>
        ${n.room ? `<span class="chip">${esc(n.room)}</span>` : ""}
        <span class="chip" style="${specd(n) ? "color:var(--green)" : ""}">${specd(n) ? "✓ spec'd" : "○ stub"}</span>
      </div>
      ${n.summary ? `<div class="sum">${esc(n.summary)}</div>` : ""}
      <div class="meta">
        <span>${v ? `<b>${v.passing}/${v.total}</b> checks` : "no contract yet"}</span>
        <span>todo <b>${(todo.doing || []).length}</b> doing · <b>${(todo.next || []).length}</b> next</span>
        ${deps.length ? `<span>needs <b>${deps.length}</b></span>` : ""}
      </div>
      ${deps.length ? `<div class="deps">${deps.map(id =>
        `<span class="dep" data-act="pick" data-id="${esc(id)}">${esc(byId()[id].title)}</span>`).join("")}</div>` : ""}
    </div>`;
  }

  function section(key, n) {
    const isInv = key === "inv";
    const items = isInv ? (n.invariants || []) : flairOf(n);
    const open = secState[key];
    const canEdit = editable();
    const editing = isInv ? S.editInv : S.editFlair;
    const meta = isInv
      ? { icon: "🔒", name: "Invariants", cls: "inv", sub: "The non-negotiables. Rules this page must never break — Claude treats these as law.", dest: "requirements.md → ## Constraints" }
      : { icon: "🎨", name: "Flair", cls: "flr", sub: "Claude's choices — things it decided that you never asked for, plus the rest of the spec's notes. Edit freely; nothing sacred here.", dest: "design.md → ## Flair" };
    let body = "";
    if (open && !editing) {
      body = `<ul class="items ${meta.cls}">${items.length
        ? items.map(i => `<li>${hl(i)}</li>`).join("")
        : `<li class="empty">${isInv ? "None pinned yet. Add the rules that must never break." : "Nothing here yet. Claude's unrequested choices will collect here."}</li>`}</ul>`;
    }
    if (open && editing) {
      body = `<div class="ed">
        <textarea id="ta-${key}" spellcheck="false">${esc(items.join("\n"))}</textarea>
        <div class="edrow">
          <button class="save" data-act="save-${key}" ${S.saving ? "disabled" : ""}>${S.saving ? "Saving…" : "Save"}</button>
          <button class="cancel" data-act="cancel-edit">Cancel</button>
          <span class="edhint">one per line · ${specd(n) ? "saves to " + meta.dest : "queued for Claude (not spec'd yet)"}</span>
        </div>
      </div>`;
    }
    return `<div class="sec">
      <div class="sech" data-act="fold" data-key="${key}">
        <span class="caret">${open ? "▼" : "▶"}</span><span>${meta.icon}</span>
        <span class="n">${meta.name}</span><span class="cnt">${items.length}</span>
        ${canEdit && open ? `<span class="ebtn" data-act="edit-${key}">${editing ? "" : "✏️ Edit"}</span>` : ""}
      </div>
      ${open ? `<div class="secsub">${meta.sub}</div>` : ""}
      ${body}
    </div>`;
  }

  function pageTab() {
    const n = cur();
    if (!n) {
      return `<div class="empty-tab">No node matches <b>${esc(location.pathname)}</b> yet.<br><br>
        Pick one from <span class="link" data-act="tab" data-tab="all">All specs</span>, map it permanently in
        <span class="mono">.github/scaffolding/routes.json</span>, or ask Claude to chart it:</div>
        <div class="acts"><button class="abtn" data-act="req-cover">📸 Cover this page</button>
        <button class="abtn" data-act="req-spec">📝 Spec it</button></div>
        <div class="acap">Buttons don't call any AI — they queue a request Claude picks up next session (it shows in /standup).</div>`;
    }
    const auto = !S.nodeId;
    return `
      <div style="display:flex;align-items:center;margin-bottom:8px;font-size:11px;color:var(--dim)">
        ${auto ? "matched to this route" : "picked manually"}
        <span class="link" style="margin-left:auto" data-act="tab" data-tab="all">change ›</span>
      </div>
      ${nodeCard(n)}
      <div class="acts">
        <button class="abtn" data-act="req-cover" title="Snapshot how it behaves today into a contract">📸 Cover</button>
        <button class="abtn" data-act="req-verify" title="Re-run its checkpoints">✅ Verify</button>
        <button class="abtn" data-act="req-spec" title="Write a full contract">📝 Spec it</button>
      </div>
      <div class="acap">These queue a request for Claude's next session — no AI is called now.</div>
      ${section("inv", n)}
      ${section("flair", n)}`;
  }

  function allTab() {
    const q = S.q.trim().toLowerCase();
    const match = n => !q || n.id.includes(q) || (n.title || "").toLowerCase().includes(q)
      || (n.summary || "").toLowerCase().includes(q) || (n.room || "").includes(q);
    const grouped = [];
    const seen = new Set();
    for (const r of roomsList()) {
      const ns = nodes().filter(n => n.room === r.id && match(n));
      ns.forEach(n => seen.add(n.id));
      if (ns.length) grouped.push({ title: r.title || r.id, ns });
    }
    const rest = nodes().filter(n => !seen.has(n.id) && !(roomsList().some(r => r.id === n.room)) && match(n));
    if (rest.length) grouped.push({ title: "ungrouped", ns: rest });
    const total = grouped.reduce((a, g) => a + g.ns.length, 0);
    return `<input class="search" id="q" placeholder="Search ${nodes().length} nodes…" value="${esc(S.q)}" data-act="q">
      ${total ? grouped.map(g => `<div class="rgrp"><div class="rgh">${esc(g.title)}</div>${g.ns.map(n => `
        <div class="nrow" data-act="pick" data-id="${esc(n.id)}">
          <span class="ki">${KIND_ICON[n.kind] || "·"}</span>
          <span class="cd dot" style="background:${ST_COLOR[n.status] || "var(--dim)"};flex:none"></span>
          <span class="nt">${esc(n.title)}</span>
          ${(n.invariants || []).length ? `<span class="tag">🔒${n.invariants.length}</span>` : ""}
          <span class="tag ${specd(n) ? "sp" : ""}">${specd(n) ? "spec" : "stub"}</span>
        </div>`).join("")}</div>`).join("")
      : `<div class="empty-tab">Nothing matches "${esc(S.q)}".</div>`}`;
  }

  function reqTab() {
    const rs = requests();
    return `${rs.length ? rs.slice().reverse().map(r => `
      <div class="req">
        <span class="achip" style="color:${ACT_COLOR[r.action] || "var(--dim)"};border-color:currentColor">${esc(r.action)}</span>
        <div class="rb">
          <div class="rt">${esc((r.node && byId()[r.node] && byId()[r.node].title) || r.node || r.route || "")}</div>
          <div class="rm">${r.note ? esc(r.note) + " · " : ""}${r.route ? esc(r.route) + " · " : ""}${timeAgo(r.ts)}</div>
        </div>
        <span class="del" data-act="req-del" data-id="${esc(r.id)}" title="Remove">✕</span>
      </div>`).join("")
      : `<div class="empty-tab">Nothing queued.<br>Buttons on the <b>This page</b> tab add requests here;<br>Claude sees them at the next <span class="mono">/standup</span>.</div>`}
      <div class="note">
        <textarea id="ta-note" placeholder="Note to Claude — anything you noticed on this page…"></textarea>
        <div class="edrow"><button class="save" data-act="req-note">Queue note</button>
        <span class="edhint">read next session · no AI call now</span></div>
      </div>`;
  }

  function drawer() {
    const rs = requests();
    let body;
    if (S.err && !S.data) {
      body = `<div class="errbox"><b>Scaffold can't reach its data.</b><br><br>
        <code>GET ${BASE}/data</code> failed (${esc(S.err)}).<br><br>
        Is the wiring installed and the gate on? Start the dev server with
        <code>SCAFFOLD_PANEL=1</code>. See <code>.github/skills/scaffolding/SKILL.md</code>,
        or run <code>/install-scaffold</code>.</div>`;
    } else {
      body = S.tab === "all" ? allTab() : S.tab === "req" ? reqTab() : pageTab();
    }
    return `<div class="drawer">
      <div class="hd"><span>⌂</span><span class="ttl">Scaffold</span>
        <span class="route mono" title="${esc(location.pathname)}">${esc(location.pathname)}</span>
        <span class="x" data-act="toggle" title="Close (Esc)">✕</span></div>
      <div class="tabs">
        <div class="tab ${S.tab === "page" ? "on" : ""}" data-act="tab" data-tab="page">This page</div>
        <div class="tab ${S.tab === "all" ? "on" : ""}" data-act="tab" data-tab="all">All specs</div>
        <div class="tab ${S.tab === "req" ? "on" : ""}" data-act="tab" data-tab="req">Requests${rs.length ? " · " + rs.length : ""}</div>
      </div>
      <div class="body">${body}</div>
      <div class="ft">🏗 scaffolding · dev-only · no AI calls · data: FEATURE_TREE.json${editable() ? "" : " · read-only"}</div>
    </div>`;
  }

  function pill() {
    const n = cur();
    const rs = requests().length;
    const dotColor = S.err && !S.data ? "var(--red)" : (n ? (ST_COLOR[n.status] || "var(--dim)") : "var(--dim)");
    return `<button class="pill" data-act="toggle" title="Scaffold — specs for this page (Esc closes)">
      <span class="dot" style="background:${dotColor}"></span>⌂ Scaffold${rs ? `<span class="rbadge">${rs}</span>` : ""}</button>`;
  }

  function render() {
    if (!root) return;
    root.innerHTML = `<div class="wrap">${css()}${S.open ? drawer() : ""}${pill()}
      ${S.toast ? `<div class="toast ${S.toastBad ? "bad" : ""}">${esc(S.toast)}</div>` : ""}</div>`;
    if (S.open && S.tab === "all" && S.qFocus) {
      const q = root.querySelector("#q");
      if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    }
  }

  /* ---------------- events ---------------- */
  function persist() {
    localStorage.setItem(LS_OPEN, S.open ? "1" : "0");
    localStorage.setItem(LS_TAB, S.tab);
  }

  function onClick(e) {
    const el = e.composedPath().find(x => x && x.dataset && x.dataset.act);
    if (!el) return;
    const act = el.dataset.act;
    S.qFocus = false;
    if (act === "toggle") { S.open = !S.open; persist(); render(); }
    else if (act === "tab") { S.tab = el.dataset.tab; persist(); render(); }
    else if (act === "pick") { S.nodeId = el.dataset.id; S.tab = "page"; S.editInv = S.editFlair = false; persist(); render(); }
    else if (act === "fold") {
      if (e.composedPath().some(x => x && x.dataset && (x.dataset.act || "").startsWith("edit-"))) return;
      secState[el.dataset.key] = !secState[el.dataset.key]; render();
    }
    else if (act === "edit-inv") { S.editInv = true; S.editFlair = false; render(); }
    else if (act === "edit-flair") { S.editFlair = true; S.editInv = false; render(); }
    else if (act === "cancel-edit") { S.editInv = S.editFlair = false; render(); }
    else if (act === "save-inv" || act === "save-flair") {
      const ta = root.querySelector(act === "save-inv" ? "#ta-inv" : "#ta-flair");
      const items = (ta ? ta.value : "").split("\n").map(s => s.trim().replace(/^[-*]\s+/, "")).filter(Boolean);
      saveSection(act === "save-inv" ? "invariants" : "flair", items);
    }
    else if (act === "req-cover") queueReq("cover");
    else if (act === "req-verify") queueReq("verify");
    else if (act === "req-spec") queueReq("spec");
    else if (act === "req-note") {
      const ta = root.querySelector("#ta-note");
      const note = ta ? ta.value.trim() : "";
      if (note) queueReq("note", note);
    }
    else if (act === "req-del") removeReq(el.dataset.id);
  }

  function onInput(e) {
    const el = e.composedPath()[0];
    if (el && el.dataset && el.dataset.act === "q") { S.q = el.value; S.qFocus = true; render(); }
  }

  /* ---------------- SPA navigation tracking ---------------- */
  function onNav() { S.nodeId = null; S.editInv = S.editFlair = false; render(); }
  ["pushState", "replaceState"].forEach(k => {
    const orig = history[k];
    history[k] = function () { const r = orig.apply(this, arguments); window.dispatchEvent(new Event("a0scaffold:nav")); return r; };
  });
  window.addEventListener("popstate", onNav);
  window.addEventListener("a0scaffold:nav", onNav);

  /* ---------------- boot ---------------- */
  function mount() {
    host = document.createElement("div");
    host.id = "__agent0_scaffold";
    root = host.attachShadow({ mode: "open" });
    (document.body || document.documentElement).appendChild(host);
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && S.open) { S.open = false; persist(); render(); }
    });
  }

  async function boot() {
    await refresh();
    mount();
    render();
    // internal hook for tests/debugging — not a public API
    window.__AGENT0_SCAFFOLD_API = { S, render, matchNode, cur, refresh };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
