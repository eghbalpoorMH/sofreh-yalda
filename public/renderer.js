/**
 * Sofreh Yalda - Glossy Vector Canvas Renderer
 * Draws the 6 Yalda Treats, Special Bombs (Line Blaster, Pomegranate Bomb, Hafez Divan),
 * Obstacles (Winter Frost 1/2 layers, Sweet Box Blocker), beams, and particle effects.
 */

class YaldaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
  }

  drawCuteFace(ctx, x, y, r, happy = true) {
    const eyeOffsetX = r * 0.26;
    const eyeOffsetY = r * 0.04;
    const eyeR = Math.max(2, r * 0.09);

    // Rosy cheeks
    ctx.fillStyle = 'rgba(255, 120, 160, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x - eyeOffsetX * 1.35, y + eyeOffsetY + r * 0.14, eyeR * 1.35, eyeR * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(x + eyeOffsetX * 1.35, y + eyeOffsetY + r * 0.14, eyeR * 1.35, eyeR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1f0818';
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
    ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX - eyeR * 0.3, y + eyeOffsetY - eyeR * 0.3, eyeR * 0.42, 0, Math.PI * 2);
    ctx.arc(x + eyeOffsetX - eyeR * 0.3, y + eyeOffsetY - eyeR * 0.3, eyeR * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Cute smile
    if (happy) {
      ctx.strokeStyle = '#1f0818';
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y + eyeOffsetY + r * 0.07, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }

  /**
   * Draws one of the 6 Yalda Treats centered at (x, y) with radius r
   */
  drawTreat(ctx, typeId, x, y, r, special = null, time = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Special Hafez Divan Color Bomb overrides standard treat shape
    if (special === 'color') {
      this.drawHafezDivanBomb(ctx, r, time);
      ctx.restore();
      return;
    }

    // Subtle idle breathing pulse for special bombs
    if (special) {
      const pulse = 1 + Math.sin(time * 7) * 0.06;
      ctx.scale(pulse, pulse);
    }

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
    ctx.shadowBlur = r * 0.32;
    ctx.shadowOffsetY = r * 0.12;

    switch (typeId) {
      case 0:
        this.drawWatermelonSlice(ctx, r);
        break;
      case 1:
        this.drawRubyPomegranate(ctx, r);
        break;
      case 2:
        this.drawSmilingPistachio(ctx, r);
        break;
      case 3:
        this.drawGoldenPersimmon(ctx, r);
        break;
      case 4:
        this.drawPurpleBaslogh(ctx, r);
        break;
      case 5:
        this.drawSaffronCookie(ctx, r);
        break;
      default:
        this.drawRubyPomegranate(ctx, r);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Overlay Special Bomb indicators (Line Blaster or Area Pomegranate Bomb)
    if (special === 'line_h' || special === 'line_v') {
      this.drawLineBlasterOverlay(ctx, r, special === 'line_h', time);
    } else if (special === 'bomb') {
      this.drawAreaBombOverlay(ctx, r, time);
    }

    ctx.restore();
  }

  // 0: قاچ هندوانه (Watermelon Slice - Red/Green Wedge)
  drawWatermelonSlice(ctx, r) {
    // Green outer rind arc at bottom
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r * 0.92, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.lineTo(0, -r * 0.88);
    ctx.closePath();
    const rindGrad = ctx.createLinearGradient(0, -r, 0, r);
    rindGrad.addColorStop(0, '#10b981');
    rindGrad.addColorStop(1, '#047857');
    ctx.fillStyle = rindGrad;
    ctx.fill();

    // Light green inner rind
    ctx.beginPath();
    ctx.arc(0, -r * 0.17, r * 0.8, 0.13 * Math.PI, 0.87 * Math.PI);
    ctx.lineTo(0, -r * 0.84);
    ctx.closePath();
    ctx.fillStyle = '#a7f3d0';
    ctx.fill();

    // Juicy crimson flesh
    ctx.beginPath();
    ctx.arc(0, -r * 0.19, r * 0.72, 0.14 * Math.PI, 0.86 * Math.PI);
    ctx.lineTo(0, -r * 0.82);
    ctx.closePath();
    const fleshGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.6);
    fleshGrad.addColorStop(0, '#ff4d6d');
    fleshGrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = fleshGrad;
    ctx.fill();

    // Gloss highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.14, -r * 0.35, r * 0.1, r * 0.24, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Cute seeds
    ctx.fillStyle = '#1f0818';
    const seeds = [[-0.26, -0.1], [0.26, -0.1], [0, -0.35]];
    seeds.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.055, r * 0.085, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    this.drawCuteFace(ctx, 0, r * 0.1, r * 0.82);
  }

  // 1: انار یاقوتی (Ruby Pomegranate with Crown)
  drawRubyPomegranate(ctx, r) {
    // Crown on top
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.62);
    ctx.lineTo(-r * 0.35, -r * 0.96);
    ctx.lineTo(-r * 0.12, -r * 0.78);
    ctx.lineTo(0, -r * 1.0);
    ctx.lineTo(r * 0.12, -r * 0.78);
    ctx.lineTo(r * 0.35, -r * 0.96);
    ctx.lineTo(r * 0.28, -r * 0.62);
    ctx.closePath();
    ctx.fill();

    // Round body
    const bodyGrad = ctx.createRadialGradient(-r * 0.28, -r * 0.25, r * 0.1, 0, 0, r * 0.85);
    bodyGrad.addColorStop(0, '#fb7185');
    bodyGrad.addColorStop(0.45, '#e11d48');
    bodyGrad.addColorStop(1, '#881337');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, r * 0.06, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Golden rim outline
    ctx.strokeStyle = 'rgba(255, 220, 180, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gloss shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.22, r * 0.15, r * 0.26, 0.45, 0, Math.PI * 2);
    ctx.fill();

    this.drawCuteFace(ctx, 0, r * 0.12, r * 0.85);
  }

  // 2: پسته خندان (Smiling Emerald Pistachio in Open Shell)
  drawSmilingPistachio(ctx, r) {
    // Inner green pistachio kernel
    const nutGrad = ctx.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.1, 0, 0, r * 0.82);
    nutGrad.addColorStop(0, '#86efac');
    nutGrad.addColorStop(0.55, '#22c55e');
    nutGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = nutGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.64, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left warm cream shell wing
    const shellGrad = ctx.createLinearGradient(-r, -r, r, r);
    shellGrad.addColorStop(0, '#fef3c7');
    shellGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = shellGrad;

    ctx.beginPath();
    ctx.ellipse(-r * 0.36, r * 0.05, r * 0.34, r * 0.78, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // Right warm cream shell wing
    ctx.beginPath();
    ctx.ellipse(r * 0.36, r * 0.05, r * 0.34, r * 0.78, 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Re-draw visible center green kernel peek
    ctx.fillStyle = nutGrad;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.44, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gloss highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.14, -r * 0.34, r * 0.11, r * 0.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    this.drawCuteFace(ctx, 0, r * 0.04, r * 0.72);
  }

  // 3: خرمالوی طلایی (Golden Orange Persimmon with Green Leaf Cap)
  drawGoldenPersimmon(ctx, r) {
    // Plump tomato-like persimmon body
    const bodyGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.2, r * 0.1, 0, r * 0.08, r * 0.85);
    bodyGrad.addColorStop(0, '#fde047');
    bodyGrad.addColorStop(0.45, '#f97316');
    bodyGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, r * 0.08, r * 0.84, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4-leaf green calyx on top
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(0, -r * 0.52);
      ctx.rotate((i - 1.5) * 0.55);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.28, r * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gloss shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.14, r * 0.14, r * 0.24, 0.4, 0, Math.PI * 2);
    ctx.fill();

    this.drawCuteFace(ctx, 0, r * 0.14, r * 0.84);
  }

  // 4: باسلوق بنفش (Royal Purple Diamond / Cushion Yalda Sweet with Walnut Top)
  drawPurpleBaslogh(ctx, r) {
    const size = r * 0.76;
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r * 0.9);
    grad.addColorStop(0, '#e9d5ff');
    grad.addColorStop(0.4, '#a855f7');
    grad.addColorStop(1, '#581c87');
    ctx.fillStyle = grad;

    // Rounded cushion / diamond shape
    ctx.beginPath();
    ctx.roundRect(-size, -size, size * 2, size * 2, r * 0.42);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Coconut / sugar dust dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const specks = [[-0.42, -0.42], [0.42, -0.4], [-0.45, 0.38], [0.44, 0.4]];
    specks.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    });

    // Golden walnut crown detail at top
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.38, r * 0.24, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawCuteFace(ctx, 0, r * 0.12, r * 0.82);
  }

  // 5: شیرینی نخودچی زعفرانی (4-Leaf Clover Golden Saffron Cookie)
  drawSaffronCookie(ctx, r) {
    const grad = ctx.createRadialGradient(-r * 0.18, -r * 0.18, r * 0.1, 0, 0, r * 0.88);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.55, '#eab308');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;

    // 4 overlapping petals (traditional Persian Nokhodchi clover shape)
    const offset = r * 0.34;
    const petalR = r * 0.46;
    ctx.beginPath();
    ctx.arc(-offset, -offset, petalR, 0, Math.PI * 2);
    ctx.arc(offset, -offset, petalR, 0, Math.PI * 2);
    ctx.arc(-offset, offset, petalR, 0, Math.PI * 2);
    ctx.arc(offset, offset, petalR, 0, Math.PI * 2);
    ctx.fill();

    // Pistachio powder garnish in top center
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -r * 0.28, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(-r * 0.06, -r * 0.3, r * 0.06, 0, Math.PI * 2);
    ctx.fill();

    this.drawCuteFace(ctx, 0, r * 0.14, r * 0.78);
  }

  /**
   * Special Overlay 1: ترقه خطی (Match-4 Line Blaster)
   */
  drawLineBlasterOverlay(ctx, r, isHorizontal, time) {
    ctx.save();
    // Pulsing golden ring
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;

    const arrowPulse = r * 0.88 + Math.sin(time * 10) * 3;

    ctx.fillStyle = '#ffffff';
    if (isHorizontal) {
      // Left & Right glowing arrowheads
      this.drawArrowHead(ctx, -arrowPulse, 0, Math.PI, r * 0.32);
      this.drawArrowHead(ctx, arrowPulse, 0, 0, r * 0.32);
      // Striped electric band
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, 0);
      ctx.lineTo(r * 0.65, 0);
      ctx.stroke();
    } else {
      // Up & Down glowing arrowheads
      this.drawArrowHead(ctx, 0, -arrowPulse, -Math.PI / 2, r * 0.32);
      this.drawArrowHead(ctx, 0, arrowPulse, Math.PI / 2, r * 0.32);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.65);
      ctx.lineTo(0, r * 0.65);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArrowHead(ctx, x, y, angle, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.6, -size * 0.7);
    ctx.lineTo(-size * 0.3, 0);
    ctx.lineTo(-size * 0.6, size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Special Overlay 2: بمب انار انفجاری (Match-L/T 3x3 Area Bomb)
   */
  drawAreaBombOverlay(ctx, r, time) {
    ctx.save();
    // Pulsing explosive aura ring
    const ringR = r * 0.94 + Math.sin(time * 12) * 2.5;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -time * 24;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bomb badge icon on bottom-right
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r * 0.52, -r * 0.52, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1f0614';
    ctx.font = `900 ${Math.round(r * 0.32)}px Vazirmatn, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', r * 0.52, -r * 0.5);
    ctx.restore();
  }

  /**
   * Special 3: دیوان حافظ رنگ‌پاک‌کن (Match-5 Color Bomb)
   */
  drawHafezDivanBomb(ctx, r, time) {
    ctx.save();
    // Rotating celestial 8-point Persian star aura
    ctx.save();
    ctx.rotate(time * 1.4);
    const starGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.05);
    starGrad.addColorStop(0, '#fffbeb');
    starGrad.addColorStop(0.5, '#f59e0b');
    starGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = starGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ornate turquoise & gold Persian Divan orb
    const orbGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.08, 0, 0, r * 0.86);
    orbGrad.addColorStop(0, '#67e8f9');
    orbGrad.addColorStop(0.45, '#0284c7');
    orbGrad.addColorStop(0.85, '#1e1b4b');
    orbGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 6 Orbiting rainbow color gems representing all Yalda treats
    const gemColors = ['#ff2e5b', '#be123c', '#22c55e', '#f97316', '#a855f7', '#eab308'];
    for (let i = 0; i < 6; i++) {
      const angle = time * 2.2 + (i * Math.PI) / 3;
      const gx = Math.cos(angle) * r * 0.56;
      const gy = Math.sin(angle) * r * 0.56;
      ctx.fillStyle = gemColors[i];
      ctx.beginPath();
      ctx.arc(gx, gy, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Center golden scroll emblem
    ctx.fillStyle = '#fef08a';
    ctx.font = `bold ${Math.round(r * 0.62)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📜', 0, 2);
    ctx.restore();
  }

  /**
   * Obstacle 1: قندیل یخ زمستانی (Winter Frost Overlay on top of a treat)
   */
  drawIceOverlay(ctx, x, y, cellSize, iceLayers) {
    if (!iceLayers || iceLayers <= 0) return;
    ctx.save();
    const pad = 4;
    const w = cellSize - pad * 2;
    const rx = x - w / 2;
    const ry = y - w / 2;

    // Translucent cyan crystal frame
    const iceGrad = ctx.createLinearGradient(rx, ry, rx + w, ry + w);
    if (iceLayers >= 2) {
      iceGrad.addColorStop(0, 'rgba(186, 230, 253, 0.62)');
      iceGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
      iceGrad.addColorStop(1, 'rgba(14, 165, 233, 0.65)');
    } else {
      iceGrad.addColorStop(0, 'rgba(224, 242, 254, 0.42)');
      iceGrad.addColorStop(1, 'rgba(56, 189, 248, 0.32)');
    }

    ctx.fillStyle = iceGrad;
    ctx.strokeStyle = iceLayers >= 2 ? '#e0f2fe' : 'rgba(186, 230, 253, 0.85)';
    ctx.lineWidth = iceLayers >= 2 ? 3 : 2;

    ctx.beginPath();
    ctx.roundRect(rx, ry, w, w, 12);
    ctx.fill();
    ctx.stroke();

    // Frost crystal icicle lines in corners
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(rx + 6, ry + 16);
    ctx.lineTo(rx + 16, ry + 6);
    ctx.moveTo(rx + w - 6, ry + w - 16);
    ctx.lineTo(rx + w - 16, ry + w - 6);
    if (iceLayers >= 2) {
      // Extra thick frost cross badge for 2-layer ice
      ctx.moveTo(rx + w - 18, ry + 6);
      ctx.lineTo(rx + w - 6, ry + 18);
    }
    ctx.stroke();

    // Small snowflake badge in top-right corner
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(rx + w - 11, ry + 11, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iceLayers >= 2 ? '۲❄' : '❄', rx + w - 11, ry + 11);

    ctx.restore();
  }

  /**
   * Obstacle 2: جعبه شیرینی یلدایی (Immovable Sweet Box Blocker)
   */
  drawSweetBox(ctx, x, y, cellSize) {
    ctx.save();
    const pad = 5;
    const w = cellSize - pad * 2;
    const rx = x - w / 2;
    const ry = y - w / 2;

    // Rich crimson & gold Persian pastry gift box
    const boxGrad = ctx.createLinearGradient(rx, ry, rx + w, ry + w);
    boxGrad.addColorStop(0, '#9f1239');
    boxGrad.addColorStop(0.5, '#881337');
    boxGrad.addColorStop(1, '#4c0519');
    ctx.fillStyle = boxGrad;
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(rx, ry, w, w, 12);
    ctx.fill();
    ctx.stroke();

    // Golden silk cross ribbons
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(x - 4, ry + 2, 8, w - 4);
    ctx.fillRect(rx + 2, y - 4, w - 4, 8);

    // Center golden bow knot
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x - 7, y - 3, 7, 4.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 7, y - 3, 7, 4.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

window.YaldaRenderer = YaldaRenderer;
