import { useEffect, useRef } from 'react';

const LINES = 12;

function generateContourPath(seed, width, height, yOffset) {
  const points = [];
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const y = yOffset + Math.sin((i + seed) * 0.7) * 40 + Math.cos((i + seed) * 0.4) * 25;
    points.push([x, y]);
  }
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cx = (points[i][0] + points[i + 1][0]) / 2;
    const cy = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q ${points[i][0]} ${points[i][1]}, ${cx} ${cy}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

export default function TopoBg() {
  const svgRef = useRef(null);
  const animRef = useRef(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      offsetRef.current += 0.003;
      const svg = svgRef.current;
      if (svg) {
        const paths = svg.querySelectorAll('path');
        paths.forEach((p, i) => {
          const d = generateContourPath(
            i * 2.5 + offsetRef.current,
            1920,
            1080,
            80 + i * 85
          );
          p.setAttribute('d', d);
        });
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', opacity: 0.045 }}
      >
        {Array.from({ length: LINES }, (_, i) => (
          <path
            key={i}
            d={generateContourPath(i * 2.5, 1920, 1080, 80 + i * 85)}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
          />
        ))}
      </svg>
    </div>
  );
}
