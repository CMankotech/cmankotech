const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.join(ROOT, "assets");
const VIDEO_PATH = path.join(ASSET_DIR, "ai-product-bg-preview.webm");
const POSTER_PATH = path.join(ASSET_DIR, "ai-product-bg-preview.png");

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const DURATION_MS = 12000;

async function main() {
  await fs.mkdir(ASSET_DIR, { recursive: true });

  const executablePath = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    chromium.executablePath(),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean).find((candidate) => fsSync.existsSync(candidate));

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
      background: #07070d;
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

    function seededRandom(seed) {
      let value = seed >>> 0;
      return function rand() {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
      };
    }

    const rand = seededRandom(4217);
    const particles = Array.from({ length: 110 }, (_, i) => ({
      x: rand(),
      y: rand(),
      radius: 0.8 + rand() * 2.6,
      phase: rand(),
      speed: 1 + (i % 4),
      color: ["#22d3ee", "#60a5fa", "#a78bfa", "#34d399", "#f59e0b"][i % 5],
    }));

    const nodes = Array.from({ length: 22 }, (_, i) => {
      const ring = i < 7 ? 92 : i < 15 ? 145 : 202;
      const angle = (i / 22) * TAU + (i % 3) * 0.31;
      return {
        ring,
        angle,
        size: 3 + (i % 4),
        color: ["#22d3ee", "#a78bfa", "#34d399", "#60a5fa"][i % 4],
      };
    });

    const streams = [
      { from: [110, 246], c1: [330, 164], c2: [600, 170], to: [825, 278], color: "#22d3ee", phase: 0.05 },
      { from: [164, 548], c1: [344, 485], c2: [578, 595], to: [862, 422], color: "#a78bfa", phase: 0.33 },
      { from: [472, 122], c1: [613, 178], c2: [700, 222], to: [930, 210], color: "#34d399", phase: 0.57 },
      { from: [770, 520], c1: [888, 610], c2: [1055, 555], to: [1180, 430], color: "#f59e0b", phase: 0.74 },
    ];

    function mix(a, b, p) {
      return a + (b - a) * p;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function roundedRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    function pointOnCubic(from, c1, c2, to, p) {
      const q = 1 - p;
      return [
        q * q * q * from[0] + 3 * q * q * p * c1[0] + 3 * q * p * p * c2[0] + p * p * p * to[0],
        q * q * q * from[1] + 3 * q * q * p * c1[1] + 3 * q * p * p * c2[1] + p * p * p * to[1],
      ];
    }

    function glow(x, y, radius, color, alpha) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color.replace("ALPHA", alpha));
      gradient.addColorStop(0.52, color.replace("ALPHA", alpha * 0.28));
      gradient.addColorStop(1, color.replace("ALPHA", 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    function strokePath(stream, t, width, alpha) {
      ctx.save();
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      const grad = ctx.createLinearGradient(stream.from[0], stream.from[1], stream.to[0], stream.to[1]);
      grad.addColorStop(0, stream.color + "00");
      grad.addColorStop(0.35, stream.color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
      grad.addColorStop(1, "#60a5fa00");
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(stream.from[0], stream.from[1]);
      ctx.bezierCurveTo(stream.c1[0], stream.c1[1], stream.c2[0], stream.c2[1], stream.to[0], stream.to[1]);
      ctx.stroke();
      ctx.restore();
    }

    function drawBackground(loop) {
      const sweep = Math.sin(loop * TAU);
      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, "#05060b");
      base.addColorStop(0.32, "#0a1020");
      base.addColorStop(0.68, "#0b0a18");
      base.addColorStop(1, "#06100f");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      glow(880 + Math.cos(loop * TAU) * 70, 238 + Math.sin(loop * TAU) * 24, 440, "rgba(34,211,238,ALPHA)", 0.18);
      glow(1045 + Math.cos(loop * TAU + 1.1) * 58, 498 + Math.sin(loop * TAU + 1.1) * 34, 390, "rgba(167,139,250,ALPHA)", 0.16);
      glow(338 + Math.cos(loop * TAU + 2.3) * 44, 556 + Math.sin(loop * TAU + 2.3) * 26, 330, "rgba(52,211,153,ALPHA)", 0.1);
      glow(586 + sweep * 34, 136 + Math.cos(loop * TAU) * 20, 260, "rgba(245,158,11,ALPHA)", 0.07);
    }

    function drawGrid(loop) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "rgba(148,163,184,0.10)";
      ctx.lineWidth = 1;
      const wave = Math.sin(loop * TAU) * 6;
      for (let x = -40; x <= W + 40; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x + wave, 0);
        ctx.lineTo(x - wave * 0.4, H);
        ctx.stroke();
      }
      for (let y = -40; y <= H + 40; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y - wave * 0.35);
        ctx.lineTo(W, y + wave);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawParticles(loop) {
      ctx.save();
      for (const p of particles) {
        const orbit = loop * TAU * p.speed + p.phase * TAU;
        const x = p.x * W + Math.sin(orbit) * (10 + p.speed * 5);
        const y = p.y * H + Math.cos(orbit * 0.8) * (8 + p.speed * 4);
        const alpha = 0.08 + 0.18 * Math.pow(0.5 + 0.5 * Math.sin(orbit), 2);
        ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawPanel(x, y, w, h, loop, accent, variant) {
      ctx.save();
      const bob = Math.sin(loop * TAU + x * 0.01) * 5;
      x += Math.cos(loop * TAU + y * 0.01) * 4;
      y += bob;

      roundedRect(x, y, w, h, 14);
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fill();
      const border = ctx.createLinearGradient(x, y, x + w, y + h);
      border.addColorStop(0, accent + "66");
      border.addColorStop(0.5, "rgba(255,255,255,0.08)");
      border.addColorStop(1, "#60a5fa44");
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.10)";
      roundedRect(x + 16, y + 16, 52, 8, 4);
      ctx.fill();
      ctx.fillStyle = accent + "88";
      roundedRect(x + w - 78, y + 16, 48, 8, 4);
      ctx.fill();

      if (variant === "bars") {
        for (let i = 0; i < 7; i += 1) {
          const barH = 16 + ((i * 19) % 46) + Math.sin(loop * TAU + i) * 7;
          ctx.fillStyle = i % 2 ? "rgba(96,165,250,0.28)" : accent + "5f";
          roundedRect(x + 20 + i * 30, y + h - 26 - barH, 16, barH, 5);
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.moveTo(x + 22, y + 58 + i * 24);
          ctx.lineTo(x + w - 24, y + 58 + i * 24);
          ctx.stroke();
        }
      } else if (variant === "roadmap") {
        for (let i = 0; i < 4; i += 1) {
          const yy = y + 52 + i * 30;
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.moveTo(x + 28, yy);
          ctx.lineTo(x + w - 28, yy);
          ctx.stroke();
          const px = x + 42 + ((i * 59 + loop * 120) % (w - 100));
          ctx.fillStyle = ["#22d3ee66", "#a78bfa66", "#34d39966", "#f59e0b66"][i];
          roundedRect(px, yy - 9, 72 + i * 13, 18, 7);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 4; i += 1) {
          const yy = y + 52 + i * 24;
          ctx.fillStyle = "rgba(255,255,255,0.09)";
          roundedRect(x + 20, yy, w - 40, 8, 4);
          ctx.fill();
          ctx.fillStyle = accent + "55";
          roundedRect(x + 20, yy, (w - 40) * (0.28 + 0.11 * i + 0.07 * Math.sin(loop * TAU + i)), 8, 4);
          ctx.fill();
        }
        ctx.strokeStyle = accent + "60";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let i = 0; i < 9; i += 1) {
          const px = x + 20 + i * ((w - 40) / 8);
          const py = y + h - 34 - Math.sin(loop * TAU + i * 0.82) * 18 - (i % 3) * 7;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawStreams(loop) {
      for (const stream of streams) {
        strokePath(stream, loop, 1.15, 0.2);
        const p = (stream.phase + loop) % 1;
        const [x, y] = pointOnCubic(stream.from, stream.c1, stream.c2, stream.to, p);
        ctx.save();
        ctx.fillStyle = stream.color + "d8";
        ctx.shadowBlur = 22;
        ctx.shadowColor = stream.color;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawCore(loop) {
      const cx = 914 + Math.sin(loop * TAU) * 14;
      const cy = 336 + Math.cos(loop * TAU * 0.75) * 10;

      ctx.save();
      roundedRect(cx - 216, cy - 208, 432, 416, 26);
      const coreFill = ctx.createLinearGradient(cx - 216, cy - 208, cx + 216, cy + 208);
      coreFill.addColorStop(0, "rgba(255,255,255,0.06)");
      coreFill.addColorStop(0.52, "rgba(34,211,238,0.035)");
      coreFill.addColorStop(1, "rgba(167,139,250,0.055)");
      ctx.fillStyle = coreFill;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < 4; i += 1) {
        const radius = 58 + i * 33;
        ctx.strokeStyle = ["rgba(34,211,238,0.22)", "rgba(96,165,250,0.15)", "rgba(167,139,250,0.16)", "rgba(52,211,153,0.10)"][i];
        ctx.lineWidth = i === 0 ? 1.4 : 1;
        ctx.setLineDash(i % 2 ? [7, 11] : [2, 10]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 1.18, radius * 0.74, Math.sin(loop * TAU) * 0.17 + i * 0.36, 0, TAU);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const resolvedNodes = nodes.map((node) => {
        const angle = node.angle + loop * TAU * (node.ring < 100 ? 0.18 : -0.09);
        return {
          x: cx + Math.cos(angle) * node.ring * 0.82,
          y: cy + Math.sin(angle) * node.ring * 0.52,
          size: node.size,
          color: node.color,
        };
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < resolvedNodes.length; i += 1) {
        for (let j = i + 1; j < resolvedNodes.length; j += 1) {
          if ((i + j) % 7 !== 0) continue;
          const a = resolvedNodes[i];
          const b = resolvedNodes[j];
          ctx.strokeStyle = "rgba(148,163,184,0.11)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const node of resolvedNodes) {
        ctx.save();
        ctx.fillStyle = node.color + "cc";
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 66);
      core.addColorStop(0, "rgba(226,232,240,0.95)");
      core.addColorStop(0.28, "rgba(34,211,238,0.70)");
      core.addColorStop(0.72, "rgba(167,139,250,0.22)");
      core.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 68, 0, TAU);
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < 5; i += 1) {
        const angle = loop * TAU * (1 + i * 0.08) + i * 1.15;
        const x = cx + Math.cos(angle) * (84 + i * 15);
        const y = cy + Math.sin(angle) * (44 + i * 9);
        ctx.fillStyle = ["#22d3ee", "#a78bfa", "#34d399", "#60a5fa", "#f59e0b"][i] + "b8";
        roundedRect(x - 18, y - 7, 36, 14, 7);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawForeground(loop) {
      ctx.save();
      const scan = 0.5 + 0.5 * Math.sin(loop * TAU);
      const scanY = mix(60, H - 90, scan);
      const grad = ctx.createLinearGradient(0, scanY - 36, 0, scanY + 36);
      grad.addColorStop(0, "rgba(34,211,238,0)");
      grad.addColorStop(0.5, "rgba(34,211,238,0.055)");
      grad.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 36, W, 72);

      const vignette = ctx.createRadialGradient(W * 0.66, H * 0.45, 140, W * 0.5, H * 0.5, 830);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.62, "rgba(0,0,0,0.13)");
      vignette.addColorStop(1, "rgba(0,0,0,0.58)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      const leftReadability = ctx.createLinearGradient(0, 0, W * 0.62, 0);
      leftReadability.addColorStop(0, "rgba(5,6,11,0.48)");
      leftReadability.addColorStop(0.62, "rgba(5,6,11,0.12)");
      leftReadability.addColorStop(1, "rgba(5,6,11,0)");
      ctx.fillStyle = leftReadability;
      ctx.fillRect(0, 0, W * 0.7, H);
      ctx.restore();
    }

    function drawFrame(ms, durationMs) {
      const loop = ((ms % durationMs) + durationMs) % durationMs / durationMs;
      ctx.clearRect(0, 0, W, H);
      drawBackground(loop);
      drawGrid(loop);
      drawStreams(loop);
      drawPanel(112, 154, 272, 154, loop, "#22d3ee", "bars");
      drawPanel(456, 82, 244, 132, loop, "#34d399", "signal");
      drawPanel(158, 462, 328, 132, loop, "#a78bfa", "roadmap");
      drawPanel(488, 516, 360, 118, loop, "#f59e0b", "signal");
      drawCore(loop);
      drawParticles(loop);
      drawForeground(loop);
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
      drawFrame(900, durationMs);
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
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 3600000,
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

      await new Promise((resolve) => {
        function tick(now) {
          const elapsed = now - start;
          drawFrame(elapsed, durationMs);
          if (elapsed < durationMs) {
            requestAnimationFrame(tick);
          } else {
            drawFrame(0, durationMs);
            resolve();
          }
        }
        requestAnimationFrame(tick);
      });

      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      await stopped;

      const blob = new Blob(chunks, { type: mimeType });
      const videoBase64 = bufferToBase64(await blob.arrayBuffer());
      return { posterBase64, videoBase64, mimeType, bytes: blob.size };
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
