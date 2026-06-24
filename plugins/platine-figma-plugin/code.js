figma.showUI(__html__, { width: 240, height: 480, title: 'PLATINE Crystal' });

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

function readFillColor(node) {
  try {
    if ('fills' in node && Array.isArray(node.fills)) {
      const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false);
      if (fill) return rgbToHex(fill.color.r, fill.color.g, fill.color.b);
    }
    if ('children' in node && node.children.length > 0) {
      return readFillColor(node.children[0]);
    }
  } catch (_) {}
  return null;
}

// When re-loading a placed crystal, read the current fill colors back from the
// Figma node so that edits made directly in Figma survive a plugin update.
// The SVG always puts stroke circles before atom circles, so the last fillable
// child carries S.ac and the first carries S.sc (when different).
function syncColorsFromNode(node, state) {
  if (!('children' in node) || node.children.length === 0) return;
  // Skip non-fill nodes (bond lines have no fill)
  const fillable = node.children.filter(c => {
    try {
      if (c.type === 'GROUP' || c.type === 'FRAME') return true;
      return 'fills' in c && Array.isArray(c.fills) && c.fills.some(f => f.type === 'SOLID');
    } catch (_) { return false; }
  });
  if (fillable.length === 0) return;
  const ac = readFillColor(fillable[fillable.length - 1]);
  if (ac) state.ac = ac;
  if (fillable.length > 1) {
    const sc = readFillColor(fillable[0]);
    if (sc && sc !== ac) state.sc = sc;
  }
}

function checkSelection() {
  const sel = figma.currentPage.selection;
  if (sel.length === 1) {
    const raw = sel[0].getPluginData('platine');
    if (raw) {
      try {
        const state = JSON.parse(raw);
        syncColorsFromNode(sel[0], state);
        figma.ui.postMessage({ type: 'LOAD_STATE', state, nodeId: sel[0].id });
        return;
      } catch (_) {}
    }
  }
  figma.ui.postMessage({ type: 'SELECTION_CLEARED' });
}

checkSelection();
figma.on('selectionchange', checkSelection);

figma.ui.onmessage = (msg) => {
  if (msg.type === 'INSERT_SVG') {
    const node = figma.createNodeFromSvg(msg.svgString);
    node.name = 'PLT Crystal';
    node.setPluginData('platine', msg.state);

    const existing = msg.nodeId ? figma.getNodeById(msg.nodeId) : null;
    if (existing && existing.parent) {
      const parent = existing.parent;
      const x = existing.x;
      const y = existing.y;
      const w = existing.width;
      const h = existing.height;
      const childVisibility = 'children' in existing
        ? existing.children.map(c => c.visible)
        : [];
      const idx = parent.children.indexOf(existing);
      existing.remove();
      idx >= 0 ? parent.insertChild(idx, node) : parent.appendChild(node);
      node.x = x;
      node.y = y;
      node.resize(w, h);
      if ('children' in node) {
        node.children.forEach((c, i) => {
          if (i < childVisibility.length) c.visible = childVisibility[i];
        });
      }
    } else {
      figma.currentPage.appendChild(node);
    }

    figma.viewport.scrollAndZoomIntoView([node]);
    figma.ui.postMessage({ type: 'INSERT_DONE', nodeId: node.id });
  }
};
