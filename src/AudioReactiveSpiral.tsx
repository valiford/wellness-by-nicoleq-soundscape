import { useEffect, useRef } from 'react';

type AudioReactiveSpiralProps = {
  analyser: AnalyserNode | null;
  color: string;
};

export default function AudioReactiveSpiral({ analyser, color }: AudioReactiveSpiralProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let raf = 0;
    let energy = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const render = () => {
      const bounds = canvas.getBoundingClientRect();
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      const radius = Math.min(bounds.width, bounds.height) * 0.36;
      analyser.getByteTimeDomainData(data);

      let total = 0;
      for (let index = 0; index < data.length; index += 1) {
        const sample = (data[index] - 128) / 128;
        total += sample * sample;
      }
      const targetEnergy = Math.min(1, Math.sqrt(total / data.length) * 3.6);
      energy += (targetEnergy - energy) * (reducedMotion ? 0.16 : 0.08);

      context.clearRect(0, 0, bounds.width, bounds.height);
      context.save();
      context.globalAlpha = 0.12 + energy * 0.28;
      context.strokeStyle = color;
      context.lineWidth = 1.2 + energy * 1.4;
      context.beginPath();

      const points = reducedMotion ? 48 : 96;
      for (let index = 0; index <= points; index += 1) {
        const sampleIndex = Math.floor((index / points) * (data.length - 1));
        const sample = (data[sampleIndex] - 128) / 128;
        const angle = (index / points) * Math.PI * 2 - Math.PI / 2;
        const pointRadius = radius + sample * (8 + energy * 20) + energy * 8;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.stroke();
      context.restore();

      frame += 1;
      if (!reducedMotion || frame % 30 === 0) raf = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(raf);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [analyser, color]);

  return <canvas ref={canvasRef} className="audio-reactive-spiral" aria-hidden="true" />;
}
