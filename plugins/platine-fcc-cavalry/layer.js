(function () {

    // ─── Constants ───────────────────────────────────────────────────
    var PI  = Math.PI;
    var TAU = PI * 2;
    var D2R = PI / 180;

    // ─── Easing functions (index = swingEase enum 0–9) ───────────────
    var EASE_FNS = [
        function (t) { return t; },
        function (t) { return -(Math.cos(PI * t) - 1) / 2; },
        function (t) { return t * t; },
        function (t) { return t * (2 - t); },
        function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
        function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
        function (t) {
            if (t === 0 || t === 1) return t;
            return t < 0.5
                ? Math.pow(2, 20 * t - 10) / 2
                : (2 - Math.pow(2, -20 * t + 10)) / 2;
        },
        function (t) {
            if (t === 0 || t === 1) return t;
            var p = 0.45, s = p / 4;
            return t < 0.5
                ? -(0.5 * Math.pow(2, 10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - s) * TAU / p))
                : 0.5 * Math.pow(2, -10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - s) * TAU / p) + 1;
        },
        function (t) {
            function bounce(u) {
                var n = 7.5625, d = 2.75, v = u;
                if (v < 1 / d)        return n * v * v;
                if (v < 2 / d)        { v -= 1.5 / d;  return n * v * v + 0.75;     }
                if (v < 2.5 / d)      { v -= 2.25 / d; return n * v * v + 0.9375;   }
                                        v -= 2.625 / d; return n * v * v + 0.984375;
            }
            return t < 0.5 ? (1 - bounce(1 - 2 * t)) / 2 : (1 + bounce(2 * t - 1)) / 2;
        },
        function (t) {
            var c = 2.5949095;
            return t < 0.5
                ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
                : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
        }
    ];

    // ─── Helpers ─────────────────────────────────────────────────────
    function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }
    function clampF(v, lo, hi)   { return Math.max(lo, Math.min(hi, v)); }

    // ─── FCC Lattice ─────────────────────────────────────────────────
    function genFCC(n) {
        var seen   = {};
        var result = [];
        function add(x, y, z) {
            var key = Math.round(x * 1000) + ',' + Math.round(y * 1000) + ',' + Math.round(z * 1000);
            if (!seen[key]) {
                seen[key] = 1;
                result.push([x - n / 2, y - n / 2, z - n / 2]);
            }
        }
        for (var ix = 0; ix < n; ix++) {
            for (var iy = 0; iy < n; iy++) {
                for (var iz = 0; iz < n; iz++) {
                    for (var a = 0; a <= 1; a++)
                        for (var b = 0; b <= 1; b++)
                            for (var c = 0; c <= 1; c++)
                                add(ix + a, iy + b, iz + c);
                    add(ix + 0.5, iy + 0.5, iz      ); add(ix + 0.5, iy + 0.5, iz + 1  );
                    add(ix + 0.5, iy,       iz + 0.5); add(ix + 0.5, iy + 1,   iz + 0.5);
                    add(ix,       iy + 0.5, iz + 0.5); add(ix + 1,   iy + 0.5, iz + 0.5);
                }
            }
        }
        return result;
    }

    function genBonds(pts) {
        var bonds    = [];
        var THRESH_SQ = 0.58;
        for (var i = 0; i < pts.length; i++) {
            for (var j = i + 1; j < pts.length; j++) {
                var dx = pts[i][0] - pts[j][0];
                var dy = pts[i][1] - pts[j][1];
                var dz = pts[i][2] - pts[j][2];
                if (dx * dx + dy * dy + dz * dz < THRESH_SQ) bonds.push([i, j]);
            }
        }
        return bonds;
    }

    // ─── 3D Rotation (Euler Y → X → Z) ──────────────────────────────
    function rot3(x, y, z, rx, ry, rz) {
        var x1 =  x * Math.cos(ry) + z * Math.sin(ry);
        var z1 = -x * Math.sin(ry) + z * Math.cos(ry);
        var y2 =  y * Math.cos(rx) - z1 * Math.sin(rx);
        var z2 =  y * Math.sin(rx) + z1 * Math.cos(rx);
        return [
            x1 * Math.cos(rz) - y2 * Math.sin(rz),
            x1 * Math.sin(rz) + y2 * Math.cos(rz),
            z2
        ];
    }

    // ─── Inputs ──────────────────────────────────────────────────────
    var n_cells = clampInt(cells, 1, 8);
    var t       = loopFrames > 0 ? time / loopFrames : time / Math.max(1, fps);
    var bsc     = latticeSize / (n_cells * 2.55);
    var ar      = bsc * clampF(atomSize / 100, 0.0001, 0.20);

    var rx = rotX * D2R;
    var ry = rotY * D2R;
    var rz = rotZ * D2R;

    var mode = clampInt(animMode, 0, 3);

    // ─── Spin ────────────────────────────────────────────────────────
    if (mode === 1) {
        var spinAx    = clampInt(spinAxis, 0, 4);
        var spinAngle = t * spinSpeed * D2R;
        if      (spinAx === 0) rx += spinAngle;
        else if (spinAx === 1) ry += spinAngle;
        else if (spinAx === 2) rz += spinAngle;
        else if (spinAx === 3) { rx += spinAngle * 0.55; ry += spinAngle; }
        else                   { rx += spinAngle * 0.37; ry += spinAngle; rz += spinAngle * 0.61; }

    // ─── Swing ───────────────────────────────────────────────────────
    } else if (mode === 2) {
        var swingAx  = clampInt(swingAxis, 0, 2);
        var phase    = (t * swingSpeed * 2.0) % 2.0;
        var norm     = phase <= 1.0 ? phase : 2.0 - phase;
        var ef       = EASE_FNS[clampInt(swingEase, 0, EASE_FNS.length - 1)] || EASE_FNS[0];
        var swAngle  = (ef(norm) * 2.0 - 1.0) * (swingRange * 0.5 * D2R);
        if      (swingAx === 0) rx += swAngle;
        else if (swingAx === 1) ry += swAngle;
        else                    rz += swAngle;

    // ─── Tumble ──────────────────────────────────────────────────────
    } else if (mode === 3) {
        rx += t * tumbleX * D2R;
        ry += t * tumbleY * D2R;
        rz += t * tumbleZ * D2R;
    }
    // mode 0 = Keyframe: rx/ry/rz driven directly by the keyframed attributes

    // ─── Oscillation ─────────────────────────────────────────────────
    if (oscOn) {
        var oscAx  = clampInt(oscAxis, 0, 2);
        var oscOff = Math.sin(t * oscFreq * TAU) * oscAmp * D2R;
        if      (oscAx === 0) rx += oscOff;
        else if (oscAx === 1) ry += oscOff;
        else                  rz += oscOff;
    }

    // ─── Generate & project ──────────────────────────────────────────
    var pts3D     = genFCC(n_cells);
    var projected = [];
    for (var pi = 0; pi < pts3D.length; pi++) {
        var p   = pts3D[pi];
        var rot = rot3(p[0], p[1], p[2], rx, ry, rz);
        projected.push({ sx: rot[0] * bsc, sy: -rot[1] * bsc, sz: rot[2] });
    }

    var sorted = projected.slice().sort(function (a, b) { return a.sz - b.sz; });

    // ─── Build path ───────────────────────────────────────────────────
    var outMode = clampInt(outputMode, 0, 2);
    var doAtoms = (outMode === 0 || outMode === 2);
    var doBonds = (outMode === 1 || outMode === 2);

    var path = new cavalry.Path();

    if (doAtoms) {
        if (mergeAtoms && sorted.length > 1) {
            for (var ai = 0; ai < sorted.length; ai++) {
                path.addEllipse(sorted[ai].sx, sorted[ai].sy, ar, ar);
            }
            path.mergeOverlaps();
            path.smooth(2, 0.5);
        } else {
            for (var ai = 0; ai < sorted.length; ai++) {
                path.addEllipse(sorted[ai].sx, sorted[ai].sy, ar, ar);
            }
        }
    }

    if (doBonds) {
        var bonds = genBonds(pts3D);
        for (var bi = 0; bi < bonds.length; bi++) {
            var b0 = projected[bonds[bi][0]];
            var b1 = projected[bonds[bi][1]];
            path.moveTo(b0.sx, b0.sy);
            path.lineTo(b1.sx, b1.sy);
        }
    }

    if (crosshairs) {
        var chLen = ar * clampF(crosshairSize, 0.05, 1.0);
        for (var ci = 0; ci < sorted.length; ci++) {
            var chX = sorted[ci].sx, chY = sorted[ci].sy;
            path.moveTo(chX - chLen, chY);
            path.lineTo(chX + chLen, chY);
            path.moveTo(chX, chY - chLen);
            path.lineTo(chX, chY + chLen);
        }
    }

    // ─── Return ───────────────────────────────────────────────────────
    var mesh = new cavalry.Mesh();
    mesh.addPath(path);
    return mesh;

})();
