figma.showUI(__html__, { width: 240, height: 480, title: 'PLATINE Crystal' });

function checkSelection() {
  const sel = figma.currentPage.selection;
  if (sel.length === 1) {
    const raw = sel[0].getPluginData('platine');
    if (raw) {
      try {
        figma.ui.postMessage({ type: 'LOAD_STATE', state: JSON.parse(raw), nodeId: sel[0].id });
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
      const idx = parent.children.indexOf(existing);
      existing.remove();
      idx >= 0 ? parent.insertChild(idx, node) : parent.appendChild(node);
      node.x = x;
      node.y = y;
    } else {
      figma.currentPage.appendChild(node);
    }

    figma.viewport.scrollAndZoomIntoView([node]);
    figma.ui.postMessage({ type: 'INSERT_DONE', nodeId: node.id });
  }
};
