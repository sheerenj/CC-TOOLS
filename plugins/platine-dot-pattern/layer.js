(function () {

    // ─── Constants ───────────────────────────────────────────────────
    var PI  = Math.PI;
    var TAU = PI * 2;
    var D2R = PI / 180;
    var CAP = 20000;            // safety cap on dot count

    // ─── Easing (for 3D-source swing, matches Platine FCC) ───────────
    var EASE_FNS = [
        function (t) { return t; },
        function (t) { return -(Math.cos(PI * t) - 1) / 2; },
        function (t) { return t * t; },
        function (t) { return t * (2 - t); },
        function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
        function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
        function (t) { if (t === 0 || t === 1) return t; return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2; },
        function (t) { if (t === 0 || t === 1) return t; var p = 0.45, s = p / 4; return t < 0.5 ? -(0.5 * Math.pow(2, 10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - s) * TAU / p)) : 0.5 * Math.pow(2, -10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - s) * TAU / p) + 1; },
        function (t) { function bn(u){var n=7.5625,d=2.75,v=u;if(v<1/d)return n*v*v;if(v<2/d){v-=1.5/d;return n*v*v+0.75;}if(v<2.5/d){v-=2.25/d;return n*v*v+0.9375;}v-=2.625/d;return n*v*v+0.984375;} return t < 0.5 ? (1 - bn(1 - 2 * t)) / 2 : (1 + bn(2 * t - 1)) / 2; },
        function (t) { var c = 2.5949095; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2; }
    ];

    // ─── Helpers ─────────────────────────────────────────────────────
    function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }
    function clampF(v, lo, hi)   { return Math.max(lo, Math.min(hi, v)); }
    function cl01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function sstep(a, b, x) { var t = cl01((x - a) / (b - a)); return t * t * (3 - 2 * t); }

    // deterministic hash / value-noise (matches the web Pattern Studio)
    function hash2(x, y, s) {
        var h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 1442695041;
        h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
        return (h >>> 0) / 4294967295;
    }
    function smv(t) { return t * t * (3 - 2 * t); }
    function vnoise(x, y, s) {
        var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = smv(xf), v = smv(yf);
        var a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
        return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    }
    function fbm(x, y, s) {
        return vnoise(x, y, s) * 0.6 + vnoise(x * 2.03, y * 2.03, s + 7) * 0.3 + vnoise(x * 4.1, y * 4.1, s + 19) * 0.1;
    }
    function fold(x, y, sym) {
        if (sym === 1) return [Math.abs(x), y];
        if (sym === 2) return [Math.abs(x), Math.abs(y)];
        if (sym === 3) { var a = Math.atan2(y, x); var r = Math.sqrt(x * x + y * y); var seg = PI / 3; a = ((a % seg) + seg) % seg; if (a > seg / 2) a = seg - a; return [Math.cos(a) * r, Math.sin(a) * r]; }
        return [x, y];
    }

    // ─── Static logo: 13-dot hexagram (normalised, half-height = 1) ──
    var RN = 0.1734;
    var LOGO = [
        [0, 0], [0.7159, 0.4133], [0.3579, 0.2067], [0, 0.8266], [0, 0.4132],
        [-0.7159, 0.4132], [-0.358, 0.2066], [-0.7159, -0.4133], [-0.3579, -0.2067],
        [0, -0.8266], [0, -0.4133], [0.7159, -0.4133], [0.3579, -0.2066]
    ];

    // ─── FCC lattice + 3D rotation (matches Platine FCC) ─────────────
    function genFCC(n) {
        var seen = {}, result = [];
        function add(x, y, z) {
            var key = Math.round(x * 1000) + ',' + Math.round(y * 1000) + ',' + Math.round(z * 1000);
            if (!seen[key]) { seen[key] = 1; result.push([x - n / 2, y - n / 2, z - n / 2]); }
        }
        for (var ix = 0; ix < n; ix++) for (var iy = 0; iy < n; iy++) for (var iz = 0; iz < n; iz++) {
            for (var a = 0; a <= 1; a++) for (var b = 0; b <= 1; b++) for (var c = 0; c <= 1; c++) add(ix + a, iy + b, iz + c);
            add(ix + 0.5, iy + 0.5, iz); add(ix + 0.5, iy + 0.5, iz + 1);
            add(ix + 0.5, iy, iz + 0.5); add(ix + 0.5, iy + 1, iz + 0.5);
            add(ix, iy + 0.5, iz + 0.5); add(ix + 1, iy + 0.5, iz + 0.5);
        }
        return result;
    }
    function rot3(x, y, z, rx, ry, rz) {
        var x1 = x * Math.cos(ry) + z * Math.sin(ry);
        var z1 = -x * Math.sin(ry) + z * Math.cos(ry);
        var y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
        var z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
        return [x1 * Math.cos(rz) - y2 * Math.sin(rz), x1 * Math.sin(rz) + y2 * Math.cos(rz), z2];
    }
    // Replicate the FCC layer's rotated, projected atom positions + radius
    function computeAtoms() {
        var n_cells = clampInt(cells, 1, 8);
        var t   = loopFrames > 0 ? time / loopFrames : time / Math.max(1, fps);
        var bsc = latticeSize / (n_cells * 2.55);
        var ar  = bsc * clampF(atomSize / 100, 0.0001, 0.20);
        var rx = rotX * D2R, ry = rotY * D2R, rz = rotZ * D2R;
        var mode = clampInt(animMode, 0, 3);
        if (mode === 1) {
            var sa = clampInt(spinAxis, 0, 4), ang = t * spinSpeed * D2R;
            if (sa === 0) rx += ang; else if (sa === 1) ry += ang; else if (sa === 2) rz += ang;
            else if (sa === 3) { rx += ang * 0.55; ry += ang; } else { rx += ang * 0.37; ry += ang; rz += ang * 0.61; }
        } else if (mode === 2) {
            var wa = clampInt(swingAxis, 0, 2), ph = (t * swingSpeed * 2.0) % 2.0, nm = ph <= 1.0 ? ph : 2.0 - ph;
            var ef = EASE_FNS[clampInt(swingEase, 0, EASE_FNS.length - 1)] || EASE_FNS[0];
            var sw = (ef(nm) * 2.0 - 1.0) * (swingRange * 0.5 * D2R);
            if (wa === 0) rx += sw; else if (wa === 1) ry += sw; else rz += sw;
        } else if (mode === 3) {
            rx += t * tumbleX * D2R; ry += t * tumbleY * D2R; rz += t * tumbleZ * D2R;
        }
        if (oscOn) {
            var oa = clampInt(oscAxis, 0, 2), off = Math.sin(t * oscFreq * TAU) * oscAmp * D2R;
            if (oa === 0) rx += off; else if (oa === 1) ry += off; else rz += off;
        }
        var p3 = genFCC(n_cells), atoms = [];
        for (var i = 0; i < p3.length; i++) { var rr = rot3(p3[i][0], p3[i][1], p3[i][2], rx, ry, rz); atoms.push({ sx: rr[0] * bsc, sy: -rr[1] * bsc }); }
        return { atoms: atoms, ar: ar };
    }
    function field3D(px, py, atoms, ar, edge) {
        var dmin = 1e18;
        for (var i = 0; i < atoms.length; i++) { var dx = px - atoms[i].sx, dy = py - atoms[i].sy, dd = dx * dx + dy * dy; if (dd < dmin) dmin = dd; }
        return 1 - sstep(ar - edge, ar + edge, Math.sqrt(dmin));
    }

    // ─── Static logo field (centred at origin, sized to patternSize) ─
    function logoFieldAt(px, py) {
        var S = clampF(logoScale, 0.05, 4), T = clampInt(tile, 1, 16), soft = clampF(edgeSoftness, 0.004, 2);
        var half = patternSize / 2, nu, nv;
        if (T <= 1) { var h = half * S; nu = px / h; nv = py / h; }
        else { var cell = patternSize / T, lx = px / cell, ly = py / cell; nu = (lx - Math.round(lx)) / (0.5 * S); nv = (ly - Math.round(ly)) / (0.5 * S); }
        var d = 1e9;
        for (var k = 0; k < LOGO.length; k++) { var ddx = nu - LOGO[k][0], ddy = nv - LOGO[k][1], dd = ddx * ddx + ddy * ddy; if (dd < d) d = dd; }
        return 1 - sstep(RN, RN + Math.max(0.004, soft), Math.sqrt(d));
    }
    function noiseFieldAt(px, py) { var sc = clampF(noiseScale, 0.05, 8) / 260; return cl01(fbm(px * sc, py * sc, seed)); }

    // ─── Dot lattice centred at origin ───────────────────────────────
    function latticePts(ext) {
        var s = spacing > 1 ? spacing : 1, lt = clampInt(latticeType, 0, 2), pts = [];
        if (lt === 1) {                                   // square
            var hsq = Math.ceil(ext / s / 2);
            for (var col = -hsq; col <= hsq; col++) for (var r = -hsq; r <= hsq; r++) pts.push({ x: col * s, y: r * s, i: col, j: r });
        } else if (lt === 2) {                            // concentric
            pts.push({ x: 0, y: 0, i: 0, j: 0 });
            var mR = ext / 2, ring = 1;
            for (var rad = s; rad <= mR; rad += s, ring++) { var nn = Math.max(6, Math.round(TAU * rad / s)), phc = (ring % 2) * (PI / nn); for (var k = 0; k < nn; k++) { var aa = phc + k * TAU / nn; pts.push({ x: Math.cos(aa) * rad, y: Math.sin(aa) * rad, i: ring, j: k }); } }
        } else {                                          // triangular
            var colStep = s * Math.sqrt(3) / 2, hc = Math.ceil(ext / colStep / 2), hr = Math.ceil(ext / s / 2);
            for (var c2 = -hc; c2 <= hc; c2++) { var yo = (c2 & 1) ? s / 2 : 0; for (var r2 = -hr; r2 <= hr; r2++) pts.push({ x: c2 * colStep, y: r2 * s + yo, i: c2, j: r2 }); }
        }
        return pts;
    }

    // ─── Build ───────────────────────────────────────────────────────
    var src      = clampInt(shapeSource, 0, 1);              // 0 = static logo, 1 = 3D logo
    var atomData = (src === 1) ? computeAtoms() : null;
    var atoms    = atomData ? atomData.atoms : null;
    var ar       = atomData ? atomData.ar : 0;
    var use3D    = (src === 1) && atoms && atoms.length;
    var edge3D   = Math.max(1.5, ar * clampF(edgeSoftness, 0.004, 2));

    var region;
    if (use3D) {
        var mxx = 0, mxy = 0;
        for (var ia = 0; ia < atoms.length; ia++) { var axx = Math.abs(atoms[ia].sx), ayy = Math.abs(atoms[ia].sy); if (axx > mxx) mxx = axx; if (ayy > mxy) mxy = ayy; }
        region = 2 * (Math.max(mxx, mxy) + ar);
    } else {
        region = patternSize;
    }
    var ext = region * 1.4142 + spacing * 2;

    var rot2 = rot2d * D2R, cosR = Math.cos(rot2), sinR = Math.sin(rot2);
    var baseR = clampF(dotSize, 0, 2) * spacing * 0.5;
    var jit = clampF(jitter, 0, 1) * spacing;
    var tau = 1 - clampF(density, 0, 1);
    var abs = clampF(abstractLogo, 0, 1);
    var sym = clampInt(symmetry, 0, 3);
    var sf = clampF(sizeField, 0, 1), sr = clampF(sizeRandom, 0, 1), sct = clampF(scatter, 0, 1);
    var inv = !!invert;

    var path = new cavalry.Path();
    var drawn = 0;
    var pts = latticePts(ext);
    for (var pi = 0; pi < pts.length; pi++) {
        var p = pts[pi];
        var px = p.x * cosR - p.y * sinR;
        var py = p.x * sinR + p.y * cosR;
        var shape;
        if (use3D) {
            shape = field3D(px, py, atoms, ar, edge3D);
        } else {
            var fp = fold(p.x, p.y, sym);
            shape = logoFieldAt(fp[0], fp[1]);
        }
        if (inv) shape = 1 - shape;
        var nf = noiseFieldAt(px, py);
        var f = nf * (1 - abs) + shape * abs;
        var test = f;
        if (sct > 0) test += (hash2(p.i, p.j, seed + 101) - 0.5) * 2 * sct;
        if (test <= tau) continue;
        var r = baseR * (1 - sf + sf * Math.max(0.04, f));
        if (sr > 0) r *= 1 + (hash2(p.i, p.j, seed + 202) - 0.5) * 2 * sr;
        if (r < 0.4) r = 0.4;
        var ex = px, ey = py;
        if (jit > 0) { ex += (hash2(p.i, p.j, seed + 303) - 0.5) * 2 * jit; ey += (hash2(p.i, p.j, seed + 404) - 0.5) * 2 * jit; }
        path.addEllipse(ex, ey, r, r);
        if (++drawn >= CAP) break;
    }

    var mesh = new cavalry.Mesh();
    mesh.addPath(path);
    return mesh;

})();
