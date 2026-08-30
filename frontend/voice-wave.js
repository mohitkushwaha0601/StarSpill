/**
 * StarSpill - Voice Waveform
 * Ported from celestial VoiceWave.tsx
 * Premium multi-band waveform visualization.
 */

function initVoiceWave(canvas, { active = false, analyser = null } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setActive: () => {}, destroy: () => {} };

  let raf = 0;
  let w = 0;
  let h = 0;
  let t = 0;
  let energy = 0;
  let isActive = active;
  let analyserNode = analyser;
  let data = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function amplitude() {
    if (analyserNode && data) {
      analyserNode.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = ((data[i] ?? 128) - 128) / 128;
        sum += v * v;
      }
      return Math.min(1, Math.sqrt(sum / data.length) * 3);
    }
    if (!isActive) return 0;
    const speech =
      0.45 +
      Math.sin(t * 5.1) * 0.22 +
      Math.sin(t * 11.7 + 1.3) * 0.14 +
      Math.sin(t * 2.3 + 0.7) * 0.18;
    return Math.max(0.08, Math.min(1, speech));
  }

  const bands = [
    { color: "255,168,74", weight: 1, width: 3.2 },
    { color: "255,96,120", weight: 0.66, width: 2.4 },
    { color: "150,120,255", weight: 0.42, width: 1.8 },
  ];

  function draw() {
    t += 0.016;
    const target = amplitude();
    energy += (target - energy) * 0.18;

    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;

    // baseline glow
    const base = ctx.createLinearGradient(0, 0, w, 0);
    base.addColorStop(0, "rgba(255,168,74,0)");
    base.addColorStop(0.5, `rgba(255,168,74,${0.3 + energy * 0.5})`);
    base.addColorStop(1, "rgba(255,168,74,0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, mid - 0.6, w, 1.2);

    bands.forEach((band, bi) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const p = x / w;
        const window_ = Math.sin(Math.PI * p) ** 1.4;
        const y =
          mid +
          Math.sin(p * (14 + bi * 9) - t * (3.2 + bi * 1.4)) *
            mid *
            0.72 *
            energy *
            band.weight *
            window_ +
          Math.sin(p * (33 + bi * 17) + t * (5 + bi)) *
            mid *
            0.2 *
            energy *
            band.weight *
            window_;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${band.color},${0.6 + energy * 0.4})`;
      ctx.lineWidth = band.width;
      ctx.shadowBlur = 28 * (0.3 + energy);
      ctx.shadowColor = `rgba(${band.color},0.9)`;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    raf = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);

  return {
    setActive(val) {
      isActive = val;
    },
    setAnalyser(node) {
      analyserNode = node;
      data = node ? new Uint8Array(node.frequencyBinCount) : null;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    },
  };
}

window.VoiceWave = { init: initVoiceWave };
