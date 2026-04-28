const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.join(ROOT, "assets");
const VARIANT = process.argv.includes("--tech") ? "tech" : "modern";
const OUTPUT_PREFIX = VARIANT === "tech" ? "ai-tech-bg-preview" : "ai-modern-bg-preview";
const VIDEO_PATH = path.join(ASSET_DIR, `${OUTPUT_PREFIX}.webm`);
const POSTER_PATH = path.join(ASSET_DIR, `${OUTPUT_PREFIX}.png`);

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 60;
const DURATION_MS = 12000;

function findBrowser() {
  return [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    chromium.executablePath(),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean).find((candidate) => fsSync.existsSync(candidate));
}

async function main() {
  await fs.mkdir(ASSET_DIR, { recursive: true });

  const executablePath = findBrowser();
  if (!executablePath) {
    throw new Error("No local Chromium/Chrome/Edge executable was found.");
  }

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });

    await page.setContent(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      margin: 0;
      overflow: hidden;
      background: #08080f;
    }
    canvas {
      display: block;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
    }
  </style>
</head>
<body>
  <canvas id="hero" width="${WIDTH}" height="${HEIGHT}"></canvas>
  <script>
    const canvas = document.getElementById("hero");
    const ctx = canvas.getContext("2d", { alpha: false });
    const W = canvas.width;
    const H = canvas.height;
    const TAU = Math.PI * 2;
    const VARIANT = "${VARIANT}";

    function seededRandom(seed) {
      let value = seed >>> 0;
      return function rand() {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
      };
    }

    const rand = seededRandom(90428);
    const palette = ["#22d3ee", "#60a5fa", "#818cf8", "#a78bfa"];
    const stars = Array.from({ length: 220 }, (_, i) => ({
      x: rand() * W,
      y: rand() * H,
      r: 0.45 + rand() * 1.7,
      phase: rand(),
      speed: 0.35 + rand() * 1.15,
      color: palette[i % palette.length],
    }));

    const coreNodes = Array.from({ length: 118 }, (_, i) => {
      const arm = i % 5;
      const depth = i / 118;
      const angle = depth * TAU * 2.7 + arm * TAU / 5;
      const radius = 38 + Math.pow(depth, 0.72) * 285 + rand() * 18;
      return {
        angle,
        radius,
        wobble: rand() * TAU,
        size: 1.2 + rand() * 3.4,
        color: palette[(i + arm) % palette.length],
      };
    });

    const filaments = Array.from({ length: 34 }, (_, i) => ({
      phase: i / 34,
      lane: i % 7,
      color: palette[i % palette.length],
      width: 0.6 + (i % 4) * 0.28,
    }));

    function hexToRgb(hex) {
      const value = hex.replace("#", "");
      return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
      ];
    }

    function rgba(hex, alpha) {
      const rgb = hexToRgb(hex);
      return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")";
    }

    function mix(a, b, p) {
      return a + (b - a) * p;
    }

    function cubic(from, c1, c2, to, p) {
      const q = 1 - p;
      return [
        q * q * q * from[0] + 3 * q * q * p * c1[0] + 3 * q * p * p * c2[0] + p * p * p * to[0],
        q * q * q * from[1] + 3 * q * q * p * c1[1] + 3 * q * p * p * c2[1] + p * p * p * to[1],
      ];
    }

    function glow(x, y, radius, color, alpha) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, rgba(color, alpha));
      g.addColorStop(0.45, rgba(color, alpha * 0.28));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    function drawBackground(loop) {
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#05050a");
      bg.addColorStop(0.32, "#08080f");
      bg.addColorStop(0.66, "#0a1020");
      bg.addColorStop(1, "#111020");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      glow(828 + Math.cos(loop * TAU) * 62, 320 + Math.sin(loop * TAU * 0.72) * 28, 490, "#22d3ee", 0.18);
      glow(1086 + Math.cos(loop * TAU + 1.4) * 54, 212 + Math.sin(loop * TAU + 1.4) * 32, 380, "#60a5fa", 0.12);
      glow(960 + Math.cos(loop * TAU + 2.2) * 48, 536 + Math.sin(loop * TAU + 2.2) * 38, 420, "#a78bfa", 0.16);
      glow(628 + Math.sin(loop * TAU) * 36, 128 + Math.cos(loop * TAU) * 24, 270, "#818cf8", 0.08);
    }

    function drawPerspectiveGrid(loop) {
      ctx.save();
      ctx.globalAlpha = 0.44;
      ctx.strokeStyle = "rgba(148,163,184,0.07)";
      ctx.lineWidth = 1;
      const horizon = 354 + Math.sin(loop * TAU) * 7;
      for (let i = -15; i <= 15; i += 1) {
        const start = W * 0.62 + i * 42;
        ctx.beginPath();
        ctx.moveTo(start, horizon);
        ctx.lineTo(W * 0.5 + i * 88, H + 80);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i += 1) {
        const p = i / 11;
        const y = mix(horizon, H + 40, Math.pow(p, 1.8));
        ctx.beginPath();
        ctx.moveTo(W * 0.35, y);
        ctx.lineTo(W + 30, y + Math.sin(loop * TAU + i) * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function nodePosition(node, loop, cx, cy) {
      const breathing = 1 + Math.sin(loop * TAU + node.wobble) * 0.035;
      const twist = loop * TAU * (node.radius < 170 ? 0.06 : -0.035);
      const angle = node.angle + twist + Math.sin(loop * TAU + node.wobble) * 0.04;
      const rx = node.radius * breathing;
      const ry = node.radius * 0.64 * breathing;
      return [
        cx + Math.cos(angle) * rx,
        cy + Math.sin(angle) * ry,
      ];
    }

    function drawConstellation(loop) {
      const cx = 850 + Math.sin(loop * TAU) * 12;
      const cy = 346 + Math.cos(loop * TAU * 0.8) * 10;
      const resolved = coreNodes.map((node) => {
        const p = nodePosition(node, loop, cx, cy);
        return { x: p[0], y: p[1], size: node.size, color: node.color, radius: node.radius };
      });

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (let ring = 0; ring < 5; ring += 1) {
        const radius = 72 + ring * 54 + Math.sin(loop * TAU + ring) * 4;
        ctx.strokeStyle = rgba(palette[ring % palette.length], 0.09 + ring * 0.018);
        ctx.lineWidth = ring === 0 ? 1.4 : 0.9;
        ctx.setLineDash(ring % 2 ? [3, 14] : [1, 11]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 1.34, radius * 0.78, 0.08 * Math.sin(loop * TAU) + ring * 0.18, 0, TAU);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (let i = 0; i < resolved.length; i += 1) {
        for (let j = i + 1; j < resolved.length; j += 1) {
          if ((i * 17 + j * 11) % 29 > 2) continue;
          const a = resolved[i];
          const b = resolved[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 150) continue;
          const alpha = Math.max(0, 0.12 - dist / 1700);
          ctx.strokeStyle = "rgba(148,163,184," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < resolved.length; i += 1) {
        const n = resolved[i];
        const pulse = 0.55 + 0.45 * Math.sin(loop * TAU * 2 + i * 0.31);
        ctx.fillStyle = rgba(n.color, 0.28 + pulse * 0.48);
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 10 + pulse * 12;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size + pulse * 1.25, 0, TAU);
        ctx.fill();
      }

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 108);
      core.addColorStop(0, "rgba(237,237,239,0.9)");
      core.addColorStop(0.14, "rgba(34,211,238,0.78)");
      core.addColorStop(0.42, "rgba(96,165,250,0.34)");
      core.addColorStop(0.74, "rgba(167,139,250,0.18)");
      core.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = core;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 46;
      ctx.beginPath();
      ctx.arc(cx, cy, 108, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    function drawFilaments(loop) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const f of filaments) {
        const lane = f.lane - 3;
        const from = [W * 0.08, 122 + f.lane * 72 + Math.sin(loop * TAU + f.lane) * 10];
        const to = [940 + Math.cos(loop * TAU + f.phase * TAU) * 24, 344 + lane * 33 + Math.sin(loop * TAU + f.phase * TAU) * 18];
        const c1 = [330 + lane * 18, from[1] - 66 - lane * 12];
        const c2 = [665 + lane * 20, to[1] + 90 * Math.sin(f.phase * TAU)];

        const grad = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
        grad.addColorStop(0, rgba(f.color, 0));
        grad.addColorStop(0.42, rgba(f.color, 0.12));
        grad.addColorStop(1, rgba(f.color, 0.02));
        ctx.strokeStyle = grad;
        ctx.lineWidth = f.width;
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], to[0], to[1]);
        ctx.stroke();

        const p = (loop * (0.72 + f.phase * 0.45) + f.phase) % 1;
        const dot = cubic(from, c1, c2, to, p);
        ctx.fillStyle = rgba(f.color, 0.72);
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(dot[0], dot[1], 2.5 + (f.lane % 3), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawStars(loop) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const star of stars) {
        const t = loop * TAU * star.speed + star.phase * TAU;
        const x = star.x + Math.sin(t) * 8;
        const y = star.y + Math.cos(t * 0.72) * 7;
        const alpha = 0.04 + Math.pow(0.5 + 0.5 * Math.sin(t), 2) * 0.2;
        ctx.fillStyle = rgba(star.color, alpha);
        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawCircuitField(loop) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const bands = [
        { y: 98, color: "#22d3ee", offset: 0.04 },
        { y: 186, color: "#60a5fa", offset: 0.29 },
        { y: 492, color: "#818cf8", offset: 0.53 },
        { y: 592, color: "#a78bfa", offset: 0.77 },
      ];

      for (const band of bands) {
        const scan = (loop + band.offset) % 1;
        const x0 = mix(92, 1050, scan);
        const alpha = 0.12 + 0.08 * Math.sin(loop * TAU + band.y * 0.02);
        const grad = ctx.createLinearGradient(70, band.y, 1090, band.y);
        grad.addColorStop(0, rgba(band.color, 0));
        grad.addColorStop(0.2, rgba(band.color, alpha * 0.42));
        grad.addColorStop(0.74, rgba(band.color, alpha));
        grad.addColorStop(1, rgba(band.color, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(72, band.y);
        for (let i = 0; i < 9; i += 1) {
          const x = 150 + i * 104;
          const y = band.y + ((i % 2) * 2 - 1) * (18 + (i % 3) * 9);
          ctx.lineTo(x, band.y);
          ctx.lineTo(x + 24, y);
          ctx.lineTo(x + 78, y);
        }
        ctx.stroke();

        ctx.fillStyle = rgba(band.color, 0.78);
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(x0, band.y + Math.sin(loop * TAU + band.offset * TAU) * 3, 3.2, 0, TAU);
        ctx.fill();

        for (let i = 0; i < 7; i += 1) {
          const px = 148 + i * 142;
          const pulse = 0.35 + 0.45 * Math.sin(loop * TAU * 2 + i + band.offset);
          ctx.fillStyle = rgba(band.color, 0.1 + pulse * 0.18);
          ctx.fillRect(px - 2, band.y - 2, 4, 4);
        }
      }

      ctx.restore();
    }

    function drawCodeGlyphs(loop) {
      const glyphs = ["01", "AI", "{ }", "</>", "API", "RAG", "LLM", "GPU", "vec", "emb", "fn()", "json"];
      ctx.save();
      ctx.font = "500 10px Geist, DM Sans, monospace";
      ctx.textBaseline = "middle";
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < 54; i += 1) {
        const column = i % 9;
        const row = Math.floor(i / 9);
        const x = 520 + column * 76 + Math.sin(loop * TAU + i * 0.37) * 9;
        const y = 72 + row * 92 + ((loop * 55 + i * 11) % 24);
        const fade = 0.035 + 0.07 * Math.pow(0.5 + 0.5 * Math.sin(loop * TAU * 1.6 + i), 2);
        ctx.fillStyle = rgba(palette[i % palette.length], fade);
        ctx.fillText(glyphs[i % glyphs.length], x, y);
      }

      ctx.restore();
    }

    function drawTechRings(loop) {
      const cx = 850 + Math.sin(loop * TAU) * 12;
      const cy = 346 + Math.cos(loop * TAU * 0.8) * 10;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < 3; i += 1) {
        const r = 138 + i * 64;
        const start = loop * TAU * (0.7 + i * 0.12) + i * 0.6;
        const color = palette[(i + 1) % palette.length];
        ctx.strokeStyle = rgba(color, 0.18 - i * 0.03);
        ctx.lineWidth = 1.4 - i * 0.18;
        ctx.setLineDash([24 + i * 8, 16 + i * 6]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.42, r * 0.74, -0.08, start, start + TAU * 0.66);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (let i = 0; i < 11; i += 1) {
        const angle = loop * TAU * 0.42 + i * TAU / 11;
        const x = cx + Math.cos(angle) * 330;
        const y = cy + Math.sin(angle) * 178;
        const color = palette[i % palette.length];
        ctx.strokeStyle = rgba(color, 0.18);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x + 12, y);
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x, y + 12);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawBinaryRain(loop) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.font = "500 9px Geist, DM Sans, monospace";
      ctx.textBaseline = "top";

      for (let col = 0; col < 18; col += 1) {
        const x = 485 + col * 42;
        const drift = (loop * 210 + col * 37) % 120;
        for (let row = -1; row < 6; row += 1) {
          const y = row * 120 + drift;
          const alpha = 0.018 + 0.038 * (1 - row / 7);
          const bit = (col + row) % 2 ? "1" : "0";
          ctx.fillStyle = rgba(palette[(col + row + 8) % palette.length], alpha);
          ctx.fillText(bit, x + Math.sin(loop * TAU + row) * 4, y);
        }
      }

      ctx.restore();
    }

    function drawLightSweep(loop) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const angle = -0.42;
      const x = mix(-220, W + 220, loop);
      ctx.translate(x, H * 0.5);
      ctx.rotate(angle);
      const g = ctx.createLinearGradient(0, -220, 0, 220);
      g.addColorStop(0, "rgba(34,211,238,0)");
      g.addColorStop(0.48, "rgba(34,211,238,0.035)");
      g.addColorStop(0.52, "rgba(167,139,250,0.04)");
      g.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-36, -420, 72, 840);
      ctx.restore();
    }

    function drawReadability(loop) {
      ctx.save();
      const left = ctx.createLinearGradient(0, 0, W * 0.72, 0);
      left.addColorStop(0, "rgba(5,5,10,0.72)");
      left.addColorStop(0.48, "rgba(8,8,15,0.38)");
      left.addColorStop(1, "rgba(8,8,15,0)");
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, W * 0.72, H);

      const bottom = ctx.createLinearGradient(0, H * 0.38, 0, H);
      bottom.addColorStop(0, "rgba(8,8,15,0)");
      bottom.addColorStop(0.66, "rgba(8,8,15,0.18)");
      bottom.addColorStop(1, "rgba(8,8,15,0.78)");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 0, W, H);

      const vignette = ctx.createRadialGradient(W * 0.68, H * 0.45, 190, W * 0.5, H * 0.5, 820);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.67, "rgba(0,0,0,0.12)");
      vignette.addColorStop(1, "rgba(0,0,0,0.58)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function drawFrame(ms, durationMs) {
      const loop = ((ms % durationMs) + durationMs) % durationMs / durationMs;
      ctx.clearRect(0, 0, W, H);
      drawBackground(loop);
      drawPerspectiveGrid(loop);
      drawStars(loop);
      drawFilaments(loop);
      if (VARIANT === "tech") {
        drawCircuitField(loop);
        drawBinaryRain(loop);
        drawCodeGlyphs(loop);
      }
      drawConstellation(loop);
      if (VARIANT === "tech") {
        drawTechRings(loop);
      }
      drawLightSweep(loop);
      drawReadability(loop);
    }

    function bufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    }

    window.renderAsset = async ({ durationMs, fps }) => {
      drawFrame(1200, durationMs);
      const posterBase64 = canvas.toDataURL("image/png").split(",")[1];

      const mimeType = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      if (!mimeType) {
        throw new Error("MediaRecorder WebM is not supported in this Chromium build.");
      }

      const chunks = [];
      const stream = canvas.captureStream(0);
      const [track] = stream.getVideoTracks();
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6000000,
      });

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      });

      const stopped = new Promise((resolve, reject) => {
        recorder.addEventListener("stop", resolve, { once: true });
        recorder.addEventListener("error", reject, { once: true });
      });

      recorder.start(250);
      const start = performance.now();
      const totalFrames = Math.round((durationMs / 1000) * fps);

      for (let frame = 0; frame <= totalFrames; frame += 1) {
        const elapsed = (frame / fps) * 1000;
        drawFrame(elapsed, durationMs);
        if (track && typeof track.requestFrame === "function") {
          track.requestFrame();
        }

        const target = start + ((frame + 1) / fps) * 1000;
        const delay = target - performance.now();
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else if (frame % 12 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      await stopped;

      const blob = new Blob(chunks, { type: mimeType });
      return {
        posterBase64,
        videoBase64: bufferToBase64(await blob.arrayBuffer()),
        mimeType,
        bytes: blob.size,
      };
    };
  </script>
</body>
</html>`);

    const result = await page.evaluate(
      ({ durationMs, fps }) => window.renderAsset({ durationMs, fps }),
      { durationMs: DURATION_MS, fps: FPS }
    );

    await fs.writeFile(VIDEO_PATH, Buffer.from(result.videoBase64, "base64"));
    await fs.writeFile(POSTER_PATH, Buffer.from(result.posterBase64, "base64"));

    console.log(JSON.stringify({
      video: VIDEO_PATH,
      poster: POSTER_PATH,
      mimeType: result.mimeType,
      width: WIDTH,
      height: HEIGHT,
      fps: FPS,
      durationSeconds: DURATION_MS / 1000,
      bytes: result.bytes,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
