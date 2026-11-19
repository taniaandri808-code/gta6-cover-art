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
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
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

  // Top accent strip for brand label
  const stripH = Math.round(H * 0.035);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 0, W, stripH);
  ctx.fillStyle = '#111';
  ctx.font = '700 ' + Math.round(W * 0.018) + 'px Arial';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEON COVER STUDIO', Math.round(W * 0.02), stripH / 2);

  const gap = Math.round(W * 0.02);
  const leftW = Math.round(W * 0.55) - gap;
  const rightW = W - leftW - gap * 2;
  const topH = Math.round(H * 0.5) - gap;
  const botH = H - topH - gap * 2;
  // Shift panels down by stripH + gap
  const panelY = stripH + gap;
  const panels = [
    { x: gap, y: panelY, w: leftW, h: H - panelY - gap },
    { x: leftW + gap * 2, y: panelY, w: rightW, h: topH },
    { x: leftW + gap * 2, y: panelY + topH + gap, w: rightW, h: botH }
  ];

  panels.forEach((p, i) => {
    const img = state.images?.[i];
    if (img) {
      drawCover(ctx, img, p.x, p.y, p.w, p.h, state.transforms?.[i]);
    } else {
      // Empty panel: sky gradient + diagonal accent stripes + centered text
      const panelGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      panelGrad.addColorStop(0, palette.sky[0]);
      panelGrad.addColorStop(1, palette.sky[2]);
      ctx.fillStyle = panelGrad;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // 5 diagonal accent stripes clipped to panel
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x, p.y, p.w, p.h);
      ctx.clip();
      const stripeW = Math.max(p.w, p.h) * 0.6;
      const stripeGap = stripeW / 5;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = Math.max(2, W * 0.003);
      ctx.lineCap = 'round';
      for (let s = 0; s < 5; s++) {
        const offset = (s - 2) * stripeGap;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2 + offset - stripeW / 2, p.y + p.h);
        ctx.lineTo(p.x + p.w / 2 + offset + stripeW / 2, p.y);
        ctx.stroke();
      }
      ctx.restore();

      // Centered 'DROP A PHOTO' text
      ctx.fillStyle = '#111';
      ctx.font = '700 ' + Math.round(W * 0.03) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DROP A PHOTO', p.x + p.w / 2, p.y + p.h / 2);
    }
    // Panel border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  });

  // Decorative elements
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.86, W * 0.09, 0, 7);
  ctx.fill();
  ctx.save();
  ctx.translate(W * 0.2, H * 0.9);
  ctx.rotate(-0.05);
  ctx.fillRect(-W * 0.3, -H * 0.06, W * 0.6, H * 0.12);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = getHalftone(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Caption lines
  const lines = (state.captionLines ?? []).map(l => l.toUpperCase()).filter(l => l.trim().length > 0);
  if (lines.length) {
    let fs = Math.round(H * 0.16);
    const maxW = W * 0.86;
    ctx.font = '900 ' + fs + 'px Arial Black';
    while (fs > 16 && lines.some(l => ctx.measureText(l).width > maxW)) {
      fs = Math.round(fs * 0.96);
      ctx.font = '900 ' + fs + 'px Arial Black';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const shadowOffset = fs / 12;
    const strokeWidth = fs / 8;
    const baselineStart = H - H * 0.045;
    const lineStep = fs * 0.9;
    lines.forEach((l, k) => {
      const y = baselineStart - k * lineStep;
      ctx.shadowColor = '#000';
      ctx.shadowOffsetX = shadowOffset;
      ctx.shadowOffsetY = shadowOffset;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(l, W / 2, y);
      ctx.fillStyle = '#fff';
      ctx.fillText(l, W / 2, y);
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    // Tagline: last non-empty caption line if different from first
    if (lines.length > 1 && lines[lines.length - 1] !== lines[0]) {
      const tagline = lines[lines.length - 1];
      const tfs = Math.round(H * 0.035);
      ctx.font = '600 ' + tfs + 'px Arial';
      ctx.fillStyle = palette.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(tagline, W / 2, baselineStart + lineStep);
    }
  }

  // White inner pinstripe frame around whole poster
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  const inset = 10;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
}
