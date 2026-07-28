/* ════════════════════════════════════════════════════════════════════════
   HEAR THE YOUTH · TOOLS UI SYSTEM  —  hty-ui.js   (master)
   ────────────────────────────────────────────────────────────────────────
   Auto-wires every component from markup. Include once, after the DOM:
     <script src="../../shared/hty-ui.js"></script>

   Re-scan after injecting markup dynamically:  HTY.init();
   Conventions (all optional — wire only what you use):
     • Sliders    .hty input[type=range][data-bind] → updates [data-out="<bind>"]
     • Tabs/tools  a group of .tab or .tbtn → single-active (click)
     • Segmented   .seg / any [data-radio] container → single-active button
     • Toggle      .track-sw            (toggles .on)
     • Checkbox    .check               (toggles .on)
     • Stepper     .stepper button[data-step] → +/- the sibling input
     • Dropdown    .hty-select          (see markup in the demo)
     • Expand      [data-expand]        → toggles .open on nearest .hty-dock
     • Zoom        [data-zoom="in|out|reset"] → updates [data-zoom-level]
     • Palette     .palette + .add-swatch     → add / remove swatches
     • XY pad      .xypad               → updates [data-xy-out] (x/ y 0–1)
     • EQ          .eq[data-eq]         → builds bands from data-eq JSON
     • Telemetry   [data-cursor]        → live "x · y" cursor readout
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CHECK = '<svg class="ck" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5l3.2 3.2L12 4"/></svg>';
  const once = (el, k) => el.dataset[k] ? false : (el.dataset[k] = '1', true);

  /* — sliders — */
  function paintRange(r) {
    const min = +r.min || 0, max = +r.max || 100, v = +r.value;
    r.style.setProperty('--fill', ((v - min) / (max - min) * 100) + '%');
    if (r.dataset.bind) {
      const out = $(`[data-out="${r.dataset.bind}"]`);
      if (out) out.textContent = (max <= 4 && r.step && +r.step < 1) ? v.toFixed(2) : v;
    }
  }
  function initRanges(root) {
    $$('.hty input[type=range]', root).forEach(r => {
      paintRange(r);
      if (once(r, 'htyR')) r.addEventListener('input', () => paintRange(r));
    });
  }

  /* — single-active groups (tabs, tool rail, segmented, chips) — */
  function initGroups(root) {
    // explicit radio containers
    $$('.hty [data-radio]', root).forEach(g => {
      if (!once(g, 'htyG')) return;
      g.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b || !g.contains(b)) return;
        $$('button', g).forEach(x => x.classList.remove('active')); b.classList.add('active');
      });
    });
    // .seg behaves as radio
    $$('.hty .seg', root).forEach(g => {
      if (!once(g, 'htyG')) return;
      g.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        $$('button', g).forEach(x => x.classList.remove('active')); b.classList.add('active');
      });
    });
    // sibling .tab / .tbtn clusters
    ['.tab', '.tbtn'].forEach(sel => {
      const all = $$('.hty ' + sel, root);
      all.forEach(btn => {
        if (!once(btn, 'htyA')) return;
        btn.addEventListener('click', () => {
          const sibs = [...btn.parentElement.children].filter(c => c.matches(sel));
          sibs.forEach(s => s.classList.remove('active')); btn.classList.add('active');
        });
      });
    });
  }

  /* — toggles + checks — */
  function initToggles(root) {
    $$('.hty .track-sw', root).forEach(t => { if (once(t, 'htyT')) t.addEventListener('click', () => t.classList.toggle('on')); });
    $$('.hty .check', root).forEach(c => { if (once(c, 'htyC')) c.addEventListener('click', () => c.classList.toggle('on')); });
  }

  /* — steppers — */
  function initSteppers(root) {
    $$('.hty .stepper', root).forEach(s => {
      if (!once(s, 'htyS')) return;
      const inp = $('input', s);
      $$('button[data-step]', s).forEach(b => b.addEventListener('click', () => {
        const step = +b.dataset.step || 1, cur = +inp.value || 0;
        inp.value = cur + step; inp.dispatchEvent(new Event('input', { bubbles: true }));
      }));
    });
  }

  /* — scrub fields : drag-to-adjust numbers (more fluid than a slider) — */
  function initScrub(root) {
    $$('.hty input[data-scrub]', root).forEach(inp => {
      if (!once(inp, 'htyScrub')) return;
      inp.readOnly = true;                          // single drag = scrub; double-click = type
      let active = false, moved = false, sx = 0, sv = 0;
      const num = a => (a === undefined || a === '') ? null : +a;
      inp.addEventListener('pointerdown', e => {
        if (!inp.readOnly) return;                  // currently editing → normal caret
        active = true; moved = false; sx = e.clientX; sv = parseFloat(inp.value) || 0;
        inp.setPointerCapture(e.pointerId);
      });
      inp.addEventListener('pointermove', e => {
        if (!active) return;
        const dx = e.clientX - sx; if (Math.abs(dx) > 2) moved = true; if (!moved) return;
        const per = parseFloat(inp.dataset.scrub) || 1, step = parseFloat(inp.dataset.step) || 1;
        const lo = num(inp.dataset.min), hi = num(inp.dataset.max);
        let v = sv + dx * per * (e.shiftKey ? 0.25 : e.altKey ? 4 : 1);
        v = Math.round(v / step) * step;
        if (lo !== null) v = Math.max(lo, v);
        if (hi !== null) v = Math.min(hi, v);
        inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true }));
      });
      inp.addEventListener('pointerup', () => { if (moved) inp.blur(); active = false; });
      inp.addEventListener('dblclick', () => { inp.readOnly = false; inp.focus(); inp.select(); });
      inp.addEventListener('blur', () => { inp.readOnly = true; });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    });
  }

  /* — canvas size : presets + custom dimensions (drives the .hty-frame artboard) — */
  function initFrame(root) {
    const frame = $('.hty-stage .hty-frame', root);
    if (!frame || !once(frame, 'htyFrame')) return;
    const reads = $$('.hty [data-size-read]', root);
    const exReads = $$('.hty [data-export-size]', root);   // final render size = artboard × multiplier
    const custom = $('.hty [data-size-custom]', root);
    const wIn = $('.hty [data-size="w"]', root), hIn = $('.hty [data-size="h"]', root);
    const sel = $('.hty [data-size-preset]', root);
    const resSeg = $('.hty [data-res]', root);
    const cur = { w: 1080, h: 1440 }; let mult = 1;
    const fmt = (w, h) => Math.round(w) + ' × ' + Math.round(h);
    if (resSeg) { const a = $('button.active', resSeg); if (a && a.dataset.mult) mult = +a.dataset.mult; }
    const updateExport = () => exReads.forEach(r => r.textContent = fmt(cur.w * mult, cur.h * mult));
    function setSize(w, h) {
      w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); cur.w = w; cur.h = h;
      frame.style.width = w + 'px'; frame.style.height = h + 'px';
      reads.forEach(r => r.textContent = fmt(w, h));
      updateExport();
      if (wIn && document.activeElement !== wIn) wIn.value = w;
      if (hIn && document.activeElement !== hIn) hIn.value = h;
      if (canvasAPI) requestAnimationFrame(() => canvasAPI.fit());
    }
    if (resSeg) resSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.mult) { mult = +b.dataset.mult; updateExport(); } });
    if (sel) sel.addEventListener('hty:change', e => {
      const v = e.detail.value;
      if (v === 'custom') { if (custom) custom.style.display = ''; }
      else { if (custom) custom.style.display = 'none'; const m = String(v).split('x').map(Number); if (m[0] && m[1]) setSize(m[0], m[1]); }
    });
    const onCustom = () => setSize(+wIn.value || 1, +hIn.value || 1);
    if (wIn) wIn.addEventListener('input', onCustom);
    if (hIn) hIn.addEventListener('input', onCustom);
    setSize(+frame.dataset.w || frame.offsetWidth || 1080, +frame.dataset.h || frame.offsetHeight || 1440);
  }

  /* — custom dropdowns — */
  function positionMenu(sel) {
    const btn = $('.hty-select-btn', sel), menu = $('.hty-select-menu', sel);
    const r = btn.getBoundingClientRect(), gap = 6, vh = innerHeight;
    const up = r.top >= (vh - r.bottom);                 // prefer up (dock sits at the bottom)
    const avail = (up ? r.top : vh - r.bottom) - gap - 8;
    menu.style.left = r.left + 'px';
    menu.style.width = r.width + 'px';
    menu.style.maxHeight = Math.max(120, Math.min(320, avail)) + 'px';
    if (up) { menu.style.bottom = (vh - r.top + gap) + 'px'; menu.style.top = 'auto'; menu.style.transformOrigin = 'bottom center'; }
    else    { menu.style.top = (r.bottom + gap) + 'px'; menu.style.bottom = 'auto'; menu.style.transformOrigin = 'top center'; }
  }
  const optValue = o => (o.dataset.value ?? o.textContent.trim());
  function syncSelectTo(sel, value) {            // reflect a value into the custom UI
    const val = $('.hty-select-val', sel);
    $$('.hty-opt', sel).forEach(o => {
      const on = optValue(o) === value;
      o.classList.toggle('is-selected', on);
      if (on && val) val.textContent = (o.dataset.label || o.textContent).trim();
    });
  }
  function initSelects(root) {
    $$('.hty .hty-select', root).forEach(sel => {
      if (!once(sel, 'htySel')) return;
      const btn = $('.hty-select-btn', sel), val = $('.hty-select-val', sel);
      const native = sel.dataset.native ? document.getElementById(sel.dataset.native) : null;
      $$('.hty-opt', sel).forEach(o => { if (!$('.ck', o)) o.insertAdjacentHTML('beforeend', CHECK); });
      if (native) {                              // backed by a hidden <select> — keep both in sync
        syncSelectTo(sel, native.value);
        native.addEventListener('change', () => syncSelectTo(sel, native.value));
      }
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = sel.classList.contains('open');
        closeAllSelects(); if (!open) { positionMenu(sel); sel.classList.add('open'); }
      });
      $$('.hty-opt', sel).forEach(o => o.addEventListener('click', () => {
        const v = optValue(o);
        $$('.hty-opt', sel).forEach(x => x.classList.remove('is-selected'));
        o.classList.add('is-selected');
        if (val) val.textContent = (o.dataset.label || o.textContent).trim();
        sel.classList.remove('open');
        if (native) { native.value = v; native.dispatchEvent(new Event('change', { bubbles: true })); }
        sel.dispatchEvent(new CustomEvent('hty:change', { detail: { value: v }, bubbles: true }));
      }));
    });
  }
  function closeAllSelects() { $$('.hty .hty-select.open').forEach(s => s.classList.remove('open')); }

  /* — tabbed panels : [data-tab="key"] tab → shows [data-tab-panel="key"] — */
  function initTabs(root) {
    const panels = $$('.hty [data-tab-panel]', root);
    if (!panels.length) return;
    const show = key => panels.forEach(p => p.style.display = p.dataset.tabPanel === key ? '' : 'none');
    $$('.hty [data-tab]', root).forEach(t => {
      if (once(t, 'htyTab')) t.addEventListener('click', () => { show(t.dataset.tab); const d = t.closest('.hty-dock'); if (d) d.classList.add('open'); });
    });
    const active = $('.hty [data-tab].active', root) || $('.hty [data-tab]', root);
    if (active) show(active.dataset.tab);
  }

  /* — case switcher : a [data-switch] segmented reveals one [data-case] at a time — */
  function initSwitch(root) {
    $$('.hty [data-switch]', root).forEach(sw => {
      if (!once(sw, 'htySwc')) return;
      const scope = sw.closest('[data-tab-panel]') || sw.closest('.hty-panel') || root;
      const show = key => $$('[data-case]', scope).forEach(c => c.style.display = c.dataset.case === key ? '' : 'none');
      sw.addEventListener('click', e => { const b = e.target.closest('[data-case-btn]'); if (b) show(b.dataset.caseBtn); });
      const a = $('[data-case-btn].active', sw) || $('[data-case-btn]', sw);
      if (a) show(a.dataset.caseBtn);
    });
  }

  /* — drag-to-resize the sidebar width (grip on its right edge) — */
  function initResize(root) {
    const dock = $('.hty-dock', root); if (!dock || !once(dock, 'htyRz')) return;
    let handle = $('.hty-resize', dock);
    if (!handle) { handle = document.createElement('div'); handle.className = 'hty-resize'; dock.appendChild(handle); }
    let drag = false, startX = 0, startW = 0;
    handle.addEventListener('pointerdown', e => {
      drag = true; startX = e.clientX; startW = dock.getBoundingClientRect().width;
      dock.classList.add('resizing'); handle.setPointerCapture(e.pointerId); e.preventDefault();
    });
    handle.addEventListener('pointermove', e => {
      if (!drag) return;
      const w = Math.max(248, Math.min(innerWidth * 0.5, startW + (e.clientX - startX)));
      dock.style.setProperty('--side-w', w + 'px');
    });
    const end = () => { drag = false; dock.classList.remove('resizing'); };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /* — collapse / reveal the sidebar (buttons auto-injected) — */
  function initCollapse(root) {
    const app = document.querySelector('.hty'); const dock = $('.hty-dock', root);
    if (!app || !dock || !once(app, 'htyCol')) return;
    let cb = $('.hty-collapse', dock);
    if (!cb) { cb = document.createElement('button'); cb.className = 'hty-collapse'; cb.type = 'button'; cb.title = 'Hide panel';
      cb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 18l-6-6 6-6M18 18l-6-6 6-6"/></svg>'; dock.appendChild(cb); }
    let rb = $('.hty-reveal', app);
    if (!rb) { rb = document.createElement('button'); rb.className = 'hty-reveal'; rb.type = 'button'; rb.title = 'Show panel';
      rb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 18l6-6-6-6M6 18l6-6-6-6"/></svg>'; app.appendChild(rb); }
    const toggle = () => app.classList.toggle('collapsed');
    cb.addEventListener('click', toggle); rb.addEventListener('click', toggle);
    $$('.hty [data-collapse]', root).forEach(b => b.addEventListener('click', toggle));
  }

  /* — expand / collapse dock — */
  function initExpand(root) {
    $$('.hty [data-expand]', root).forEach(b => {
      if (!once(b, 'htyX')) return;
      b.addEventListener('click', () => {
        const dock = b.closest('.hty-dock') || $('.hty-dock');
        if (dock) { dock.classList.toggle('open'); b.classList.toggle('open', dock.classList.contains('open')); }
      });
    });
  }

  /* — zoom (display-only fallback when there's no .hty-canvas) — */
  function initZoom(root) {
    if ($('.hty-stage .hty-canvas')) return;   // a live canvas owns the zoom HUD
    const lvl = $('.hty [data-zoom-level]', root); let z = 100;
    $$('.hty [data-zoom]', root).forEach(b => {
      if (!once(b, 'htyZ')) return;
      b.addEventListener('click', () => {
        const m = b.dataset.zoom;
        z = m === 'in' ? Math.min(400, z + 10) : m === 'out' ? Math.max(10, z - 10) : 100;
        if (lvl) lvl.textContent = z + '%';
      });
    });
  }

  /* — canvas : native pan / drag-to-move / wheel-zoom (design-software feel) — */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let canvasAPI = null;
  function initCanvas(root) {
    const stage = $('.hty-stage', root), canvas = stage && $('.hty-canvas', stage);
    if (!stage || !canvas || !once(stage, 'htyCv')) return;
    const lvl = $('.hty [data-zoom-level]');
    const tf  = $('.hty [data-transform]');
    const tfIn = tf ? { x: $('[data-tf="x"]', tf), y: $('[data-tf="y"]', tf), scale: $('[data-tf="scale"]', tf), rotate: $('[data-tf="rotate"]', tf) } : null;
    let scale = 1, x = 0, y = 0, space = false, selected = null;

    /* view transform (whole canvas) */
    const apply = () => { canvas.style.transform = `translate(${x}px,${y}px) scale(${scale})`; if (lvl) lvl.textContent = Math.round(scale * 100) + '%'; };
    /* object transform (one [data-draggable]) — translate + scale + rotate about its centre */
    const applyObj = el => { const tx = +el.dataset.tx || 0, ty = +el.dataset.ty || 0, s = +el.dataset.scale || 1, r = +el.dataset.rot || 0;
      el.style.transformOrigin = 'center'; el.style.transform = `translate(${tx}px,${ty}px) scale(${s}) rotate(${r}deg)`; };
    const fillTf = el => { if (!tfIn || !el) return;
      if (tfIn.x)      tfIn.x.value      = Math.round(+el.dataset.tx || 0);
      if (tfIn.y)      tfIn.y.value      = Math.round(+el.dataset.ty || 0);
      if (tfIn.scale)  tfIn.scale.value  = Math.round((+el.dataset.scale || 1) * 100);
      if (tfIn.rotate) tfIn.rotate.value = Math.round(+el.dataset.rot || 0); };
    const select = el => { if (selected) selected.classList.remove('hty-selected'); selected = el;
      if (el) { el.classList.add('hty-selected'); fillTf(el); } };

    /* transform fields → selected object (two-way) */
    if (tfIn) Object.entries(tfIn).forEach(([k, inp]) => { if (!inp) return;
      inp.addEventListener('input', () => { if (!selected) return; const v = parseFloat(inp.value) || 0;
        if (k === 'x') selected.dataset.tx = v;
        else if (k === 'y') selected.dataset.ty = v;
        else if (k === 'scale') selected.dataset.scale = Math.max(1, v) / 100;
        else selected.dataset.rot = v;
        applyObj(selected); }); });

    const tool   = () => { const a = $('.hty-tools .tbtn.active'); return a ? (a.title || '').toLowerCase() : 'select'; };
    const canPan = () => space || tool() === 'pan';
    const cursor = () => { stage.classList.toggle('grab', canPan()); if (!canPan()) stage.classList.remove('grabbing'); };

    addEventListener('keydown', e => { if (e.code === 'Space' && !/input|textarea/i.test(e.target.tagName)) { space = true; cursor(); e.preventDefault(); } });
    addEventListener('keyup',   e => { if (e.code === 'Space') { space = false; cursor(); } });
    $$('.hty-tools .tbtn').forEach(b => b.addEventListener('click', cursor));

    /* zoom toward a point (px relative to stage) */
    function zoomAt(cx, cy, factor) { const ns = clamp(scale * factor, 0.1, 6); x = cx - (cx - x) * (ns / scale); y = cy - (cy - y) * (ns / scale); scale = ns; apply(); }
    stage.addEventListener('wheel', e => { e.preventDefault(); const r = stage.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey || !e.shiftKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });

    /* fit & centre — frames all canvas content (incl. moved / scaled objects) */
    function fit() {
      const items = [...canvas.children], sr = stage.getBoundingClientRect();
      if (!items.length) { x = 0; y = 0; scale = 1; apply(); return; }
      x = 0; y = 0; scale = 1; apply();                          // identity, to measure natural bounds
      let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
      items.forEach(it => { const r = it.getBoundingClientRect();
        a = Math.min(a, r.left - sr.left); b = Math.min(b, r.top - sr.top);
        c = Math.max(c, r.right - sr.left); d = Math.max(d, r.bottom - sr.top); });
      const cw = Math.max(1, c - a), ch = Math.max(1, d - b);
      scale = clamp(Math.min(sr.width / cw, sr.height / ch) * 0.86, 0.1, 6);
      x = sr.width / 2 - ((a + c) / 2) * scale;
      y = sr.height / 2 - ((b + d) / 2) * scale;
      apply();
    }

    /* zoom HUD : −/＋ around centre, Fit recentres */
    $$('.hty [data-zoom]', root).forEach(btn => btn.addEventListener('click', () => {
      const r = stage.getBoundingClientRect(), m = btn.dataset.zoom;
      if (m === 'reset') fit();
      else zoomAt(r.width / 2, r.height / 2, m === 'in' ? 1.2 : 1 / 1.2);
    }));

    /* pan (view) + move (object) */
    let mode = null, sx = 0, sy = 0, ox = 0, oy = 0, el = null;
    stage.addEventListener('pointerdown', e => {
      const drag = e.target.closest('[data-draggable]'); sx = e.clientX; sy = e.clientY;
      if (!canPan() && e.button === 0 && tool() === 'select') {
        if (drag) { select(drag); mode = 'move'; el = drag; ox = +el.dataset.tx || 0; oy = +el.dataset.ty || 0; }
        else { select(null); return; }
      } else if (canPan() || e.button === 1) {
        mode = 'pan'; ox = x; oy = y; stage.classList.add('grabbing');
      } else return;
      stage.setPointerCapture(e.pointerId); e.preventDefault();
    });
    stage.addEventListener('pointermove', e => {
      if (!mode) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (mode === 'pan') { x = ox + dx; y = oy + dy; apply(); }
      else { el.dataset.tx = ox + dx / scale; el.dataset.ty = oy + dy / scale; applyObj(el); fillTf(el); }   // drag works even while scaled
    });
    const end = () => { mode = null; el = null; stage.classList.remove('grabbing'); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    $$('[data-draggable]', canvas).forEach(applyObj);   // honour any preset tx/ty/scale/rot
    cursor(); apply();
    canvasAPI = { fit, reset: fit, zoomAt, select, applyObj, get selected() { return selected; }, get state() { return { x, y, scale }; } };
  }

  /* — palette — */
  function initPalette(root) {
    const GRAYS = ['#1a1a1a', '#525252', '#8a8a87', '#b8b8b4', '#e2e2de'];
    $$('.hty .palette', root).forEach(p => {
      if (!once(p, 'htyP')) return;
      const add = $('.add-swatch', p);
      if (add) add.addEventListener('click', () => {
        const s = document.createElement('span'); s.className = 'swatch';
        s.style.background = GRAYS[($$('.swatch', p).length) % GRAYS.length];
        s.innerHTML = '<span class="x">×</span>';
        p.insertBefore(s, add);
      });
      p.addEventListener('click', e => { if (e.target.classList.contains('x')) e.target.closest('.swatch').remove(); });
    });
  }

  /* — XY pad — */
  function initXY(root) {
    $$('.hty .xypad', root).forEach(pad => {
      if (!once(pad, 'htyXY')) return;
      let pt = $('.pt', pad), chh = $('.ch-h', pad), chv = $('.ch-v', pad);
      if (!pt) { pad.insertAdjacentHTML('beforeend', '<div class="ch-h"></div><div class="ch-v"></div><div class="pt"></div>'); pt = $('.pt', pad); chh = $('.ch-h', pad); chv = $('.ch-v', pad); }
      const out = pad.dataset.xyOut ? $(`[data-out="${pad.dataset.xyOut}"]`) : null;
      let drag = false;
      const place = (x, y) => { pt.style.left = chv.style.left = x * 100 + '%'; pt.style.top = chh.style.top = y * 100 + '%'; if (out) out.textContent = `x ${x.toFixed(2)} · y ${(1 - y).toFixed(2)}`; };
      const set = e => { const r = pad.getBoundingClientRect(); place(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))); };
      place(.5, .5);
      pad.addEventListener('pointerdown', e => { drag = true; pad.setPointerCapture(e.pointerId); set(e); });
      pad.addEventListener('pointermove', e => { if (drag) set(e); });
      pad.addEventListener('pointerup', () => drag = false);
    });
  }

  /* — EQ bands — */
  function initEQ(root) {
    $$('.hty .eq[data-eq]', root).forEach(eq => {
      if (!once(eq, 'htyEQ')) return;
      let cfg; try { cfg = JSON.parse(eq.dataset.eq); } catch { cfg = []; }
      const onChange = eq.dataset.eqChange && global[eq.dataset.eqChange];
      cfg.forEach(({ hz, v = .5 }) => {
        const band = document.createElement('div'); band.className = 'band';
        band.innerHTML = `<div class="cap"><div class="dot"></div></div><div class="hz">${hz}</div>`;
        eq.appendChild(band);
        const cap = $('.cap', band), dot = $('.dot', band); let drag = false;
        const place = val => { dot.style.top = (1 - val) * 100 + '%'; cap.dataset.v = val; };
        const set = e => { const r = cap.getBoundingClientRect(); place(Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height))); if (onChange) onChange(vals()); };
        place(v);
        cap.addEventListener('pointerdown', e => { drag = true; cap.setPointerCapture(e.pointerId); set(e); });
        cap.addEventListener('pointermove', e => { if (drag) set(e); });
        cap.addEventListener('pointerup', () => drag = false);
      });
      const vals = () => $$('.cap', eq).map(c => +c.dataset.v);
      eq.htyVals = vals;
      if (onChange) onChange(vals());
    });
  }

  /* — cursor telemetry — */
  let cursorBound = false;
  function initCursor(root) {
    const out = $('.hty [data-cursor]', root); if (!out || cursorBound) return; cursorBound = true;
    addEventListener('mousemove', e => { out.textContent = String(e.clientX).padStart(3, '0') + ' · ' + String(e.clientY).padStart(3, '0'); });
  }

  function init(root = document) {
    initRanges(root); initGroups(root); initToggles(root); initSteppers(root); initScrub(root);
    initSelects(root); initTabs(root); initSwitch(root); initResize(root); initCollapse(root); initExpand(root); initCanvas(root); initFrame(root); initZoom(root); initPalette(root);
    initXY(root); initEQ(root); initCursor(root);
  }

  document.addEventListener('click', closeAllSelects);
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', () => init());

  global.HTY = { init, paintRange, $, $$, get canvas() { return canvasAPI; } };
})(window);
