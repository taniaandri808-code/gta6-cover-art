import { palettes } from './palettes.js';

let halftone = null;
function getHalftone(ctx) {
  if (!halftone) {
    halftone = document.createElement('canvas');
    halftone.width = 24;
    halftone.height = 24;
    const hc = halftone.getContext('2d');
    hc.fillStyle = 'rgba(0,0,0,0.8)';
    hc.beginPath();
    hc.arc(6, 6, 3, 0, 7);
    hc.fill();
    hc.beginPath();
    hc.arc(18, 18, 3, 0, 7);
    hc.fill();
  }
  return ctx.createPattern(halftone, 'repeat');
}

function drawCover(ctx, img, x, y, w, h, p = {}) {
  if (!img) return;
  const { scale = 1, ox = 0, oy = 0 } = p;
  const cw = w / scale, ch = h / scale;
  const iw = img.width, ih = img.height;
  const fit = Math.max(cw / iw, ch / ih);
  const sw = cw / fit, sh = ch / fit;
  let sx = (iw - sw) / 2 - (ox || 0) / scale;
  let sy = (ih - sh) / 2 - (oy || 0) / scale;
  sx = Math.max(0, Math.min(iw - sw, sx));
  sy = Math.max(0, Math.min(ih - sh, sy));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function renderPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const palette = palettes[state.paletteIndex ?? 0];

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, palette.sky[0]);
  g.addColorStop(1, palette.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const gap = Math.round(W * 0.02);
  const leftW = Math.round(W * 0.55) - gap;
  const rightW = W - leftW - gap * 2;
  const topH = Math.round(H * 0.5) - gap;
  const botH = H - topH - gap * 2;
  const panels = [
    { x: gap, y: gap, w: leftW, h: H - gap * 2 },
    { x: leftW + gap * 2, y: gap, w: rightW, h: topH },
    { x: leftW + gap * 2, y: topH + gap * 2, w: rightW, h: botH }
  ];

  panels.forEach((p, i) => {
    const img = state.images?.[i];
    drawCover(ctx, img, p.x, p.y, p.w, p.h, state.transforms?.[i]);
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    grad.addColorStop(0, palette.sky[1] + '66');
    grad.addColorStop(1, palette.accent + '44');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // (1) accent circle and two rotated blocks behind the caption
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.86, W * 0.09, 0, 7);
  ctx.fill();
  ctx.save();
  ctx.translate(W * 0.2, H * 0.9);
  ctx.rotate(-0.05);
  ctx.fillRect(-W * 0.3, -H * 0.06, W * 0.6, H * 0.12);
  ctx.restore();

  // (2) halftone overlay
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = getHalftone(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // (3) top-left label
  ctx.fillStyle = palette.accent;
  ctx.font = '700 ' + Math.round(W * 0.02) + 'px Arial';
  ctx.fillText('NEON COVER STUDIO', W * 0.025, H * 0.045);

  const lines = (state.captionLines ?? []).map(l => l.toUpperCase());
  if (lines.length) {
    let fs = 120;
    ctx.font = '900 ' + fs + 'px Arial Black';
    const maxW = W * 0.88;
    while (fs > 16 && lines.some(l => ctx.measureText(l).width > maxW)) {
      fs -= 2;
      ctx.font = '900 ' + fs + 'px Arial Black';
    }
    const lh = fs * 1.15;
    const blockH = lines.length * lh;
    const cy = H - gap - blockH / 2;
    const r = blockH * 0.7;
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(W / 2, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = fs / 7;
    lines.forEach((l, i) => {
      const y = cy - blockH / 2 + i * lh + lh * 0.75;
      ctx.strokeText(l, W / 2, y);
      ctx.fillText(l, W / 2, y);
    });
  }

  ctx.fillStyle = '#fff';
  ctx.font = '600 ' + Math.round(W * 0.025) + 'px Arial Black';
  ctx.fillText('NEON COVER STUDIO', gap * 1.5, gap * 1.5 + Math.round(W * 0.025));
}
