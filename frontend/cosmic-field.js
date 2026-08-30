/**
 * StarSpill - Cosmic Field Background
 * Ported from celestial CosmicField.tsx
 * Mouse-reactive deep-space field with parallax stars and nebula blobs.
 */

function initCosmicField(canvas, density = 1) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => {} };

  let w = 0;
  let h = 0;
  let dpr = 1;
  let stars = [];
  let raf = 0;
  let t = 0;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const motion = { boost: 0, vx: 0, vy: 0, lx: 0, ly: 0, lt: 0 };

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.floor(((w * h) / 6000) * density);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.9 + 0.1,
      r: Math.random() * 1.3 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }));
  }

  function onPointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.tx = (e.clientX - rect.left) / rect.width - 0.5;
    pointer.ty = (e.clientY - rect.top) / rect.height - 0.5;

    const now = performance.now();
    if (motion.lt > 0) {
      const dt = Math.max(now - motion.lt, 8);
      const dx = e.clientX - motion.lx;
      const dy = e.clientY - motion.ly;
      const speed = Math.hypot(dx, dy) / dt;
      const target = Math.min(speed / 1.2, 1);
      if (target > motion.boost) motion.boost = target;
      const mag = Math.hypot(dx, dy) || 1;
      motion.vx = dx / mag;
      motion.vy = dy / mag;
    }
    motion.lx = e.clientX;
    motion.ly = e.clientY;
    motion.lt = now;
  }

  function draw() {
    t += 0.006 * (1 + motion.boost * 2.5);
    pointer.x += (pointer.tx - pointer.x) * (0.05 + motion.boost * 0.12);
    pointer.y += (pointer.ty - pointer.y) * (0.05 + motion.boost * 0.12);
    motion.boost *= 0.955;
    const boost = motion.boost;

    ctx.clearRect(0, 0, w, h);

    // nebula clouds
    const blobs = [
      { cx: 0.28, cy: 0.32, c: "255,120,60", s: 0.55 },
      { cx: 0.74, cy: 0.28, c: "120,90,255", s: 0.5 },
      { cx: 0.5, cy: 0.85, c: "255,190,90", s: 0.45 },
    ];
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const px = (b.cx + Math.sin(t + i) * 0.02 - pointer.x * 0.06) * w;
      const py = (b.cy + Math.cos(t * 0.8 + i) * 0.02 - pointer.y * 0.06) * h;
      const rad = Math.max(w, h) * b.s * (1 + boost * 0.25);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, `rgba(${b.c},${(0.16 + boost * 0.14).toFixed(3)})`);
      g.addColorStop(0.45, `rgba(${b.c},${(0.05 + boost * 0.05).toFixed(3)})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // stars with depth parallax + lens warp near cursor
    const mx = (pointer.x + 0.5) * w;
    const my = (pointer.y + 0.5) * h;
    for (const s of stars) {
      s.tw += 0.02 + s.z * 0.03 + boost * 0.08;
      let x = s.x + pointer.x * 90 * s.z * (1 + boost);
      let y = s.y + pointer.y * 90 * s.z * (1 + boost);

      const dx = x - mx;
      const dy = y - my;
      const dist = Math.hypot(dx, dy);
      const lens = 180 + boost * 160;
      if (dist < lens) {
        const push = (1 - dist / lens) ** 2 * (26 + boost * 90);
        x += (dx / (dist || 1)) * push;
        y += (dy / (dist || 1)) * push;
      }

      const alpha = Math.min(
        (0.25 + s.z * 0.6) * (0.65 + Math.sin(s.tw) * 0.35) * (1 + boost * 1.1),
        1,
      );
      const size = s.r * (0.6 + s.z) * (1 + boost * 0.6);
      const spikes = 4;
      const outerR = size;
      const innerR = size * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const sx = x + Math.cos(angle) * r;
        const sy = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(255,240,220,${alpha.toFixed(3)})`;
      ctx.fill();
    }

    // cursor aura
    const aura = ctx.createRadialGradient(mx, my, 0, mx, my, 220 + boost * 160);
    aura.addColorStop(0, `rgba(255,170,80,${(0.10 + boost * 0.22).toFixed(3)})`);
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    raf = requestAnimationFrame(draw);
  }

  build();
  draw();
  window.addEventListener("resize", build);
  window.addEventListener("pointermove", onPointer);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onPointer);
    },
  };
}

window.CosmicField = { init: initCosmicField };
