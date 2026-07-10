"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { CATEGORIES, resolveVar, severityToken } from "@/lib/client";
import type { QuakeMarker } from "@/lib/liveQuakes";
import type { FlightMarker } from "@/lib/liveFlights";

export interface WorldMapHandle {
  flyTo: (lon: number, lat: number, zoom?: number) => void;
}

export interface Corridor {
  from: [number, number];
  to: [number, number];
  label: string;
  status: "active" | "strained" | "closed";
  note: string;
}
export const CORRIDORS: Corridor[] = [
  { from: [34.27, 31.22], to: [34.45, 31.55], label: "Rafah → North Gaza", status: "active", note: "18 trucks/day" },
  { from: [67.0, 24.86], to: [68.94, 26.06], label: "Karachi → Sindh camps", status: "active", note: "2 camps live" },
  { from: [69.2, 34.42], to: [70.45, 34.42], label: "Jalalabad airlift → Kunar", status: "active", note: "shelter kits" },
  { from: [37.2, 19.6], to: [25.35, 13.63], label: "Port Sudan → El Fasher", status: "strained", note: "chlorine low" },
  { from: [35.5, 33.9], to: [35.2, 33.27], label: "Beirut → South Lebanon", status: "active", note: "returns rising" },
];

export interface MapLayers {
  events: boolean;
  corridors: boolean;
  pulses: boolean;
  pressure: boolean;
  graticule: boolean;
  quakes: boolean;
  flights: boolean;
}

// Hand-authored simplified coastline polygons — stylized/illustrative, not
// cartographically precise or politically authoritative (not real GeoJSON).
// Country markers use real lon/lat so they'll drop onto a real basemap later
// without rework if this ever gets swapped for Natural Earth / d3-geo data.
const LAND: [number, number][][] = [
  [[-168, 68], [-155, 71], [-140, 69], [-128, 71], [-115, 73], [-95, 73], [-80, 73], [-70, 68], [-60, 60], [-55, 50], [-67, 44], [-75, 37], [-80, 31], [-81, 25], [-87, 30], [-94, 29], [-97, 25], [-97, 20], [-95, 16], [-90, 13], [-83, 8], [-79, 7], [-85, 11], [-92, 15], [-105, 20], [-110, 24], [-117, 33], [-124, 40], [-124, 48], [-135, 58], [-152, 60], [-166, 62]],
  [[-52, 60], [-43, 60], [-32, 68], [-20, 70], [-25, 78], [-40, 82], [-58, 80], [-68, 77], [-58, 68]],
  [[-78, 7], [-70, 12], [-62, 11], [-52, 5], [-44, -3], [-35, -8], [-39, -15], [-41, -23], [-48, -28], [-53, -34], [-58, -39], [-65, -41], [-66, -47], [-69, -52], [-74, -53], [-73, -45], [-71, -33], [-70, -20], [-76, -14], [-81, -6], [-80, 0]],
  [[-17, 15], [-16, 21], [-10, 27], [-6, 32], [0, 35], [10, 35], [20, 33], [30, 31], [34, 28], [36, 22], [39, 17], [43, 11], [48, 11], [51, 10], [46, 2], [40, -3], [39, -9], [36, -15], [35, -20], [32, -26], [28, -33], [20, -35], [17, -30], [14, -22], [12, -15], [9, -6], [9, 1], [4, 6], [-5, 5], [-8, 4], [-13, 8], [-17, 12]],
  [[-10, 36], [-9, 43], [-1, 44], [0, 47], [-4, 48], [-1, 50], [4, 53], [8, 55], [8, 57], [5, 59], [6, 62], [13, 66], [18, 70], [26, 71], [32, 70], [42, 68], [52, 69], [62, 70], [72, 73], [82, 73], [92, 75], [102, 77], [112, 74], [122, 73], [132, 72], [142, 72], [152, 70], [162, 69], [172, 67], [179, 65], [172, 61], [161, 60], [157, 52], [150, 60], [142, 54], [140, 46], [135, 43], [130, 42], [127, 39], [126, 35], [121, 31], [121, 25], [114, 22], [108, 18], [109, 12], [105, 9], [100, 13], [103, 1], [100, 6], [98, 10], [94, 16], [91, 22], [87, 21], [81, 15], [80, 8], [77, 8], [73, 16], [68, 23], [66, 25], [58, 25], [57, 20], [55, 17], [52, 16], [45, 12], [43, 13], [43, 17], [39, 21], [35, 28], [34, 31], [30, 31], [27, 37], [23, 36], [22, 40], [19, 40], [15, 38], [15, 44], [12, 45], [5, 43], [3, 41], [0, 39], [-6, 36]],
  [[-5, 50], [-6, 55], [-4, 59], [-1, 57], [0, 53], [1, 51]],
  [[130, 31], [134, 34], [140, 36], [142, 40], [143, 45], [140, 43], [136, 36], [131, 32]],
  [[95, 5], [99, 1], [104, -3], [107, -7], [114, -8], [110, -7], [104, -5], [96, 2]],
  [[109, 1], [114, 4], [117, 7], [119, 1], [116, -3], [110, -2]],
  [[119, 1], [122, 1], [123, -3], [121, -5], [119, -2]],
  [[120, 18], [122, 14], [124, 10], [122, 6], [120, 12]],
  [[131, -1], [138, -2], [145, -5], [148, -9], [141, -9], [134, -4]],
  [[44, -12], [50, -16], [47, -25], [44, -20]],
  [[114, -22], [114, -34], [118, -35], [124, -33], [130, -32], [136, -35], [139, -37], [146, -39], [150, -37], [153, -30], [153, -25], [146, -19], [142, -11], [136, -12], [132, -11], [126, -14], [122, -18]],
  [[173, -35], [176, -38], [178, -38], [175, -41], [171, -44], [167, -46], [170, -43], [172, -40]],
  [[-22, 64], [-15, 66], [-14, 65], [-20, 63]],
  [[80, 9], [82, 7], [81, 6], [79, 8]],
];

function inPoly(x: number, y: number, poly: [number, number][]): boolean {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

// Dot-matrix land texture, precomputed once at module load (not per-frame).
const DOTS: [number, number][] = [];
(function seedDots() {
  const step = 1.7;
  for (let lat = -58; lat <= 82; lat += step) {
    for (let lon = -179; lon <= 179; lon += step) {
      for (const p of LAND) {
        if (inPoly(lon, lat, p)) {
          DOTS.push([lon, lat]);
          break;
        }
      }
    }
  }
})();

type LabelType = "region" | "sea" | "country";
const LABELS: [string, number, number, number, LabelType][] = [
  ["EUROPE", 16, 50, 1.5, "region"], ["AFRICA", 18, 2, 1.7, "region"], ["ASIA", 94, 46, 1.7, "region"],
  ["INDIAN OCEAN", 76, -18, 1, "sea"], ["ARABIAN SEA", 63, 14, 0.85, "sea"], ["ATLANTIC OCEAN", -28, 12, 1, "sea"], ["MEDITERRANEAN", 17, 35, 0.7, "sea"], ["BAY OF BENGAL", 89, 13, 0.8, "sea"],
  ["SAUDI ARABIA", 45, 23, 1, "country"], ["EGYPT", 30, 27, 1, "country"], ["SUDAN", 30, 15, 1, "country"], ["PAKISTAN", 69, 29, 1, "country"], ["AFGHANISTAN", 66, 34, 1, "country"], ["IRAN", 54, 32, 1, "country"], ["TÜRKİYE", 35, 39, 1, "country"], ["IRAQ", 44, 33, 0.9, "country"], ["SYRIA", 38, 35, 0.85, "country"], ["YEMEN", 47, 15, 0.9, "country"], ["NIGERIA", 8, 10, 1, "country"], ["INDIA", 79, 22, 1, "country"], ["INDONESIA", 113, -1, 1, "country"], ["MALAYSIA", 102, 4, 0.9, "country"], ["SOMALIA", 46, 6, 0.9, "country"], ["MOROCCO", -7, 32, 0.9, "country"], ["ALGERIA", 3, 28, 0.9, "country"], ["LIBYA", 18, 27, 0.9, "country"], ["ETHIOPIA", 39, 9, 0.9, "country"], ["BANGLADESH", 90, 24, 0.85, "country"], ["LEBANON", 35.8, 33.9, 0.8, "country"],
];

// Canvas world map: stylized coastline base, category-colored event markers,
// country community-pressure rings + labels, animated aid corridors,
// graticule. Pan + zoom.
// IMPORTANT: canvas fillStyle/gradients require concrete colors — CSS var()/
// color-mix() do NOT parse, so every color here is resolved to hex/rgba first.
export const WorldMap = forwardRef<WorldMapHandle, {
  events: EventDTO[];
  countries: CountryDTO[];
  layers: MapLayers;
  selectedId: number | null;
  onSelect: (id: number) => void;
  quakes?: QuakeMarker[];
  flights?: FlightMarker[];
}>(function WorldMap({ events, countries, layers, selectedId, onSelect, quakes = [], flights = [] }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef({ lon: 34, lat: 26, zoom: 1.35 });
  const dragRef = useRef<{ x: number; y: number; lon: number; lat: number } | null>(null);
  const hitRef = useRef<{ x: number; y: number; r: number; id: number }[]>([]);
  const dataRef = useRef({ events, countries, layers, selectedId, quakes, flights });
  dataRef.current = { events, countries, layers, selectedId, quakes, flights };

  useImperativeHandle(ref, () => ({
    flyTo(lon, lat, zoom) {
      const cam = camRef.current;
      const start = { ...cam };
      const end = { lon, lat, zoom: zoom ?? Math.max(cam.zoom, 3.4) };
      const t0 = performance.now();
      const dur = 650;
      function step(t: number) {
        const p = Math.min(1, (t - t0) / dur);
        const q = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        cam.lon = start.lon + (end.lon - start.lon) * q;
        cam.lat = start.lat + (end.lat - start.lat) * q;
        cam.zoom = start.zoom + (end.zoom - start.zoom) * q;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Fit both axes (not just width) so the stylized coastlines don't stretch.
    function baseScale(w: number, h: number) {
      return Math.min(w / 360, h / 190);
    }
    function project(lon: number, lat: number, w: number, h: number) {
      const cam = camRef.current;
      const scale = baseScale(w, h) * cam.zoom;
      const x = w / 2 + (lon - cam.lon) * scale;
      const y = h / 2 - (lat - cam.lat) * scale;
      return { x, y, scale };
    }

    function spacedText(str: string, x: number, y: number, gap: number) {
      let total = 0;
      for (const ch of str) total += ctx.measureText(ch).width + gap;
      total -= gap;
      let cx = x - total / 2;
      const prevAlign = ctx.textAlign;
      ctx.textAlign = "left";
      for (const ch of str) {
        const w = ctx.measureText(ch).width;
        ctx.fillText(ch, cx, y);
        cx += w + gap;
      }
      ctx.textAlign = prevAlign;
    }

    function drawLabels(w: number, h: number, dk: boolean, zoom: number) {
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const [name, lon, lat, sz, type] of LABELS) {
        const p = project(lon, lat, w, h);
        if (p.x < -90 || p.x > w + 90 || p.y < -30 || p.y > h + 30) continue;
        if (type === "region") {
          if (zoom > 3) continue;
          ctx.font = `600 ${13 * sz}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = dk ? "rgba(150,172,196,.12)" : "rgba(60,84,108,.15)";
          spacedText(name, p.x, p.y, 6 * sz);
        } else if (type === "sea") {
          if (zoom > 3) continue;
          ctx.font = `italic 400 ${11 * sz}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = dk ? "rgba(110,150,190,.24)" : "rgba(70,110,150,.32)";
          spacedText(name, p.x, p.y, 2.4 * sz);
        } else {
          if (zoom < 1.5) continue;
          const a = Math.min(1, (zoom - 1.5) / 1.1);
          ctx.font = `600 ${10.5 * sz}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = (dk ? "rgba(196,210,226," : "rgba(44,64,86,") + 0.55 * a + ")";
          spacedText(name, p.x, p.y, 1.4 * sz);
        }
      }
    }

    function drawStar(x: number, y: number, r: number, col: string, ring: boolean, ringCol: string, textColForEdge: string) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8 - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.45;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = textColForEdge;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (ring) {
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = ringCol;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawCorridor(c: Corridor, w: number, h: number, ts: number) {
      const a = project(c.from[0], c.from[1], w, h);
      const b = project(c.to[0], c.to[1], w, h);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const cx = mx - (dy / len) * Math.min(len * 0.28, 60);
      const cy = my + (dx / len) * Math.min(len * 0.28, 60);
      const tok = c.status === "active" ? "--faith" : c.status === "strained" ? "--humanitarian" : "--conflict";
      const col = resolveVar(tok);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.strokeStyle = withAlpha(col, 0.55);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([]);
      ctx.stroke();

      if (c.status !== "closed") {
        const p = ((ts / 2200 + c.from[0] * 0.01) % 1 + 1) % 1;
        const t = p, mt = 1 - t;
        const px = mt * mt * a.x + 2 * mt * t * cx + t * t * b.x;
        const py = mt * mt * a.y + 2 * mt * t * cy + t * t * b.y;
        ctx.beginPath();
        ctx.arc(px, py, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        const gg = ctx.createRadialGradient(px, py, 0, px, py, 8);
        gg.addColorStop(0, withAlpha(col, 0.55));
        gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    }

    function drawQuake(q: QuakeMarker, w: number, h: number, ts: number) {
      const p = project(q.lon, q.lat, w, h);
      if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) return;
      const col = "#ff7a45"; // distinct from category palette — live/hazard layer
      const r = 3 + Math.max(0, q.mag) * 1.6;

      // Expanding "seismic" ring — faster/bigger for stronger quakes.
      const ph = ((ts / (1400 - Math.min(600, q.mag * 120)) + q.id.length * 0.29) % 1 + 1) % 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + ph * (14 + q.mag * 3), 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(col, (1 - ph) * 0.55);
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(col, 0.85);
      ctx.fill();
      ctx.strokeStyle = withAlpha("#fff", 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function drawFlight(f: FlightMarker, w: number, h: number) {
      if (f.onGround) return; // only show aircraft actually in the air
      const p = project(f.lon, f.lat, w, h);
      if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) return;
      const col = "#4fd1ff"; // distinct cool tone — live/traffic layer
      const heading = ((f.headingDeg ?? 0) * Math.PI) / 180;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(heading);
      ctx.beginPath();
      ctx.moveTo(0, -4.5);
      ctx.lineTo(2.6, 3.2);
      ctx.lineTo(0, 1.6);
      ctx.lineTo(-2.6, 3.2);
      ctx.closePath();
      ctx.fillStyle = withAlpha(col, 0.9);
      ctx.fill();
      ctx.restore();
    }

    function draw(ts: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const { events, countries, layers, selectedId, quakes, flights } = dataRef.current;
      const dk = document.documentElement.getAttribute("data-theme") !== "light";
      const cam = camRef.current;
      const s = baseScale(w, h) * cam.zoom;

      // ocean background
      const bg = resolveVar("--bg");
      const bg2 = resolveVar("--bg2");
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bg2);
      grad.addColorStop(1, bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // graticule
      if (layers.graticule) {
        ctx.strokeStyle = dk ? "rgba(110,150,190,.10)" : "rgba(70,110,150,.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 30) {
          const a = project(lon, 85, w, h);
          const b = project(lon, -85, w, h);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        for (let lat = -60; lat <= 80; lat += 30) {
          const a = project(-180, lat, w, h);
          const b = project(180, lat, w, h);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      }

      // filled landmasses — stylized real-map base
      ctx.beginPath();
      for (const poly of LAND) {
        poly.forEach((pt, i) => {
          const x = w / 2 + (pt[0] - cam.lon) * s;
          const y = h / 2 - (pt[1] - cam.lat) * s;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
      ctx.fillStyle = dk ? "rgba(19,28,39,.62)" : "rgba(205,216,227,.7)";
      ctx.fill();
      ctx.lineJoin = "round";
      ctx.strokeStyle = dk ? "rgba(90,112,136,.34)" : "rgba(120,140,162,.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // dotted land texture on top
      const dotR = Math.max(1.05, s * 0.42);
      ctx.fillStyle = dk ? "rgba(120,146,172,.16)" : "rgba(90,112,136,.2)";
      for (const [lon, lat] of DOTS) {
        const x = w / 2 + (lon - cam.lon) * s;
        const y = h / 2 - (lat - cam.lat) * s;
        if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
        ctx.beginPath();
        ctx.arc(x, y, dotR * 0.82, 0, Math.PI * 2);
        ctx.fill();
      }

      drawLabels(w, h, dk, cam.zoom);

      // pressure rings + country name labels
      if (layers.pressure) {
        const textCol = resolveVar("--text");
        for (const c of countries) {
          const p = project(c.pos[0], c.pos[1], w, h);
          const radius = 8 + (c.score / 100) * 34;
          const tok = c.score >= 75 ? "--conflict" : c.score >= 50 ? "--humanitarian" : c.score >= 30 ? "--economy" : "--faith";
          const col = resolveVar(tok);
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = withAlpha(col, 0.35);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = withAlpha(col, 0.06);
          ctx.fill();

          if (p.x > -60 && p.x < w + 60 && p.y > -20 && p.y < h + 20) {
            ctx.font = "600 11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = withAlpha(textCol, 0.8);
            ctx.fillText(c.name, p.x, p.y - radius - 6);
          }
        }
      }

      // aid corridors
      if (layers.corridors) {
        for (const c of CORRIDORS) drawCorridor(c, w, h, ts);
      }

      // live earthquakes (USGS, Muslim-world filtered)
      if (layers.quakes) {
        for (const q of quakes) drawQuake(q, w, h, ts);
      }

      // live flights (OpenSky, Muslim-world filtered)
      if (layers.flights) {
        for (const f of flights) drawFlight(f, w, h);
      }

      // event markers
      hitRef.current = [];
      if (layers.events) {
        const edgeCol = dk ? "#080C11" : "#ffffff";
        for (const e of events) {
          const p = project(e.lon, e.lat, w, h);
          if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;
          const col = resolveVar(CATEGORIES[e.category].token);
          const sel = e.id === selectedId;
          const crit = e.severity === "critical" || e.severity === "high";
          const r = sel ? 9 : crit ? 6.3 : 4.8;

          if (layers.pulses && crit) {
            const ph = ((ts / 1600 + e.id * 0.37) % 1 + 1) % 1;
            const pr = 10 + ph * 26;
            ctx.beginPath();
            ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
            ctx.strokeStyle = withAlpha(col, (1 - ph) * 0.5);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
          gg.addColorStop(0, withAlpha(col, 0.33));
          gg.addColorStop(1, "transparent");
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
          ctx.fill();

          drawStar(p.x, p.y, r, col, !!sel, col, sel ? resolveVar("--text") : edgeCol);
          hitRef.current.push({ x: p.x, y: p.y, r: r + 5, id: e.id });
        }
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // interactions
  function onDown(e: React.MouseEvent) {
    const cam = camRef.current;
    dragRef.current = { x: e.clientX, y: e.clientY, lon: cam.lon, lat: cam.lat };
  }
  function onMove(e: React.MouseEvent) {
    const d = dragRef.current;
    if (!d) return;
    const canvas = canvasRef.current!;
    const scale = Math.min(canvas.clientWidth / 360, canvas.clientHeight / 190) * camRef.current.zoom;
    camRef.current.lon = d.lon - (e.clientX - d.x) / scale;
    camRef.current.lat = d.lat + (e.clientY - d.y) / scale;
    camRef.current.lat = Math.max(-70, Math.min(82, camRef.current.lat));
  }
  function onUp(e: React.MouseEvent) {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && Math.abs(e.clientX - d.x) < 4 && Math.abs(e.clientY - d.y) < 4) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let best: { id: number; dist: number } | null = null;
      for (const h of hitRef.current) {
        const dist = Math.hypot(h.x - mx, h.y - my);
        if (dist <= h.r && (!best || dist < best.dist)) best = { id: h.id, dist };
      }
      if (best) onSelect(best.id);
    }
  }
  function onWheel(e: React.WheelEvent) {
    const cam = camRef.current;
    cam.zoom = Math.max(0.8, Math.min(16, cam.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
  }

  return (
    <div className="map-canvas-wrap">
      <canvas
        ref={canvasRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => (dragRef.current = null)}
        onWheel={onWheel}
        style={{ cursor: "grab" }}
      />
    </div>
  );
});

// Blend a hex/rgb color with an alpha, returning rgba() the canvas can parse.
function withAlpha(color: string, alpha: number): string {
  const c = color.trim();
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    const full = hex.length === 3 ? hex.split("").map((x) => x + x).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (c.startsWith("rgb")) {
    const nums = c.replace(/rgba?\(|\)/g, "").split(",").slice(0, 3).map((x) => x.trim());
    return `rgba(${nums.join(",")},${alpha})`;
  }
  return c;
}
