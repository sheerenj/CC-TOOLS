// host.jsx — ExtendScript running inside After Effects
// Called from the CEP panel via CSInterface.evalScript()
// Target: After Effects CC 2022+ (v22.0+) — JSON is built-in, no include needed

// ── Returns a writable temp file path ────────────────────────────────────────
function PT_getTempPath() {
  return Folder.temp.fsName + '/pt_export.json';
}

// ── Creates an AE composition from JSON data written to a temp file ──────────
function PT_buildComp(jsonFilePath) {
  try {
    // Read the JSON file written by the panel
    var dataFile = new File(jsonFilePath);
    if (!dataFile.exists) return 'ERR:File not found — ' + jsonFilePath;
    dataFile.encoding = 'UTF-8';
    dataFile.open('r');
    var raw = dataFile.read();
    dataFile.close();

    var data = JSON.parse(raw);

    var compW    = data.compW    || 1920;
    var compH    = data.compH    || 1080;
    var fps      = data.fps      || 24;
    var duration = data.duration || 5;
    var bgHex    = data.bgColor  || '#000000';
    var compName = data.compName || 'Particle Typeface';
    var frames   = data.frames;
    var colors   = data.colors;   // array of hex strings, one per color slot

    if (!frames || frames.length === 0) return 'ERR:No frame data received';
    if (!app.project)                   return 'ERR:No project open in After Effects';

    var nFrames  = frames.length;
    var nDots    = frames[0].length;
    var compCx   = compW / 2;
    var compCy   = compH / 2;
    var frameDt  = duration / nFrames; // seconds per recorded frame

    // Convert CSS hex (#rrggbb) to AE float array [r,g,b] in 0–1 range
    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16) / 255,
        parseInt(hex.substr(2, 2), 16) / 255,
        parseInt(hex.substr(4, 2), 16) / 255
      ];
    }

    // Create composition
    var comp = app.project.items.addComp(compName, compW, compH, 1, duration, fps);
    comp.bgColor = hexToRgb(bgHex);

    app.beginUndoGroup('Particle Typeface: ' + compName);

    // ── One shape layer per color group ──────────────────────────────────────
    // Keeps layers manageable and lets you apply effects per-color.
    var colorLayers = [];
    for (var ci = 0; ci < colors.length; ci++) {
      var sl = comp.layers.addShape();
      sl.name  = 'Particles — Color ' + (ci + 1);
      sl.label = (ci % 16) + 1;
      colorLayers.push({
        layer:    sl,
        contents: sl.property('ADBE Root Vectors Group'),
        rgb:      hexToRgb(colors[ci])
      });
    }

    // ── Add each particle as a group inside its color layer ───────────────────
    // Structure: Shape Layer > Contents > Group (per dot) > Ellipse + Fill + Transform
    // Position keyframes live on "Transform: Group N" > Position (shape-space, origin = comp center)

    for (var d = 0; d < nDots; d++) {
      var firstFrame = frames[0][d];
      var colorIdx   = (firstFrame.ci !== undefined && firstFrame.ci < colorLayers.length)
                       ? firstFrame.ci : 0;
      var cl         = colorLayers[colorIdx];

      // Add group
      var grp        = cl.contents.addProperty('ADBE Vector Group');
      grp.name       = 'dot_' + d;
      var grpVecs    = grp.property('ADBE Vectors Group');

      // Ellipse — size from first frame (r is radius in panel coords, already scaled to comp)
      var ellipse = grpVecs.addProperty('ADBE Vector Shape - Ellipse');
      var diam    = firstFrame.r * 2;
      ellipse.property('ADBE Vector Ellipse Size').setValue([diam, diam]);

      // Fill color
      var fill = grpVecs.addProperty('ADBE Vector Graphic - Fill');
      fill.property('ADBE Vector Fill Color').setValue(cl.rgb);

      // Position keyframes on group transform
      // Shape layer coords: origin at comp center, y axis same direction as AE (down = positive)
      var posProp = grp.property('ADBE Vector Transform Group').property('ADBE Vector Position');

      for (var fi = 0; fi < nFrames; fi++) {
        var dot = frames[fi][d];
        var t   = fi * frameDt;          // time in seconds
        var sx  = dot.x - compCx;        // shape-space x
        var sy  = dot.y - compCy;        // shape-space y
        posProp.setValueAtTime(t, [sx, sy]);
      }
    }

    app.endUndoGroup();
    comp.openInViewer();

    return 'OK:' + nDots + ' particles | ' + nFrames + ' frames | comp "' + compName + '"';

  } catch (err) {
    try { app.endUndoGroup(); } catch (e2) {}
    return 'ERR:' + err.toString() + ' (line ' + err.line + ')';
  }
}
