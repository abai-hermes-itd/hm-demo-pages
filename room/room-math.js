/* R07 room math: pure functions, no DOM. Points are [x,y,z] metres, y = up. Area is computed in the horizontal plane (x,z). */
(function (root) {
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  function area(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[2] - b[0] * a[2]; }
    return Math.abs(s) / 2;
  }
  function sides(pts) { return pts.map((p, i) => d2(p, pts[(i + 1) % pts.length])); }
  function angles(pts) {
    return pts.map((p, i) => {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
      const v1 = [a[0] - p[0], a[2] - p[2]], v2 = [b[0] - p[0], b[2] - p[2]];
      const c = (v1[0] * v2[0] + v1[1] * v2[1]) / ((Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1])) || 1);
      return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
    });
  }
  function segInter(p1, p2, p3, p4) {
    const o = (a, b, c) => (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0;
  }
  function selfIntersects(pts) {
    const n = pts.length;
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segInter(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true;
    }
    return false;
  }
  function analyze(pts) {
    if (!pts || pts.length < 3) return null;
    const ys = pts.map((p) => p[1]);
    const out = { n: pts.length, areaM2: area(pts), sidesM: sides(pts), anglesDeg: angles(pts), floorSpreadM: Math.max(...ys) - Math.min(...ys), selfIntersects: selfIntersects(pts), warnings: [] };
    if (pts.length === 4) { out.diagsM = [d2(pts[0], pts[2]), d2(pts[1], pts[3])]; out.diagDiffPct = 100 * Math.abs(out.diagsM[0] - out.diagsM[1]) / ((out.diagsM[0] + out.diagsM[1]) / 2); }
    if (out.selfIntersects) out.warnings.push("Стороны пересекаются: углы отмечены не по кругу.");
    if (out.floorSpreadM > 0.05) out.warnings.push("Углы на разной высоте (" + (out.floorSpreadM * 100).toFixed(0) + " см): дрейф трекинга или не пол.");
    if (out.diagDiffPct > 2) out.warnings.push("Диагонали различаются на " + out.diagDiffPct.toFixed(1) + "%: комната не прямоугольная либо точки неточны.");
    return out;
  }
  /* tape reference: sides [a,b,c,d] in metres (same order as corners), optional diagonal0 (corner0-corner2). */
  function tapeArea(t) {
    const s = t.sides && t.sides.map(Number);
    if (!s || s.length < 4 || s.some((v) => !(v > 0))) return null;
    const heron = (a, b, c) => { const p = (a + b + c) / 2; const q = p * (p - a) * (p - b) * (p - c); return q > 0 ? Math.sqrt(q) : 0; };
    if (t.diag0 > 0) return { areaM2: heron(s[0], s[1], t.diag0) + heron(s[2], s[3], t.diag0), basis: "стороны + диагональ" };
    return { areaM2: ((s[0] + s[2]) / 2) * ((s[1] + s[3]) / 2), basis: "допущение: прямоугольник" };
  }
  function compare(res, t) {
    const ta = tapeArea(t); if (!ta || !res) return null;
    const sideErr = t.sides.map((v, i) => 100 * (res.sidesM[i] - v) / v);
    return { tapeAreaM2: ta.areaM2, tapeBasis: ta.basis, areaErrPct: 100 * (res.areaM2 - ta.areaM2) / ta.areaM2, sideErrPct: sideErr };
  }
  const api = { area, sides, angles, selfIntersects, analyze, tapeArea, compare };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.R07MATH = api;
})(typeof window !== "undefined" ? window : globalThis);
