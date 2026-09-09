import { useEffect, useRef } from "react";

interface Particle3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
  speed: number;
}

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    let scrollY = window.scrollY;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Create 3D particles system
    const particleCount = width < 768 ? 25 : 55;
    const particles: Particle3D[] = [];
    const colors = [
      "rgba(130, 255, 0, 0.45)",  // Neon Lime
      "rgba(160, 32, 240, 0.4)",  // Electric Purple
      "rgba(255, 0, 100, 0.35)",  // Hot Pink
    ];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * width * 1.5;
      const y = (Math.random() - 0.5) * height * 1.5;
      const z = Math.random() * 800 + 100;
      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: Math.random() * 2.5 + 1,
        color: colors[i % colors.length],
        speed: Math.random() * 0.4 + 0.1,
      });
    }

    const fov = 400; // Field of view depth calculation

    const render = () => {
      // Easing mouse movement
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw subtle 3D Perspective Grid lines near bottom
      const gridY = height * 0.8;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(130, 255, 0, 0.06)";

      for (let i = -10; i <= 10; i++) {
        const xStart = centerX + i * 80 + mouseX * 40;
        ctx.beginPath();
        ctx.moveTo(xStart, gridY);
        const xEnd = centerX + i * 250 + mouseX * 120;
        ctx.lineTo(xEnd, height);
        ctx.stroke();
      }

      // Draw horizontal 3D depth grid planes
      for (let j = 0; j < 5; j++) {
        const py = gridY + Math.pow(j / 5, 2) * (height - gridY);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }

      // Render and connect 3D particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move along Z based on speed and scroll
        p.z -= p.speed;
        if (p.z <= 10) {
          p.z = 800;
        }

        // Apply mouse camera tilt & scroll offsets
        const rotatedX = p.x + mouseX * 60;
        const rotatedY = p.y + mouseY * 60 - (scrollY * 0.15) % height;

        // Perspective projection
        const scale = fov / (fov + p.z);
        const projX = centerX + rotatedX * scale;
        const projY = centerY + rotatedY * scale;
        const projSize = p.size * scale * 1.8;

        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          // Draw particle node
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.5, projSize), 0, Math.PI * 2);
          ctx.fill();

          // Connect nearby particles with subtle neon lines
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const scale2 = fov / (fov + p2.z);
            const projX2 = centerX + (p2.x + mouseX * 60) * scale2;
            const projY2 = centerY + (p2.y + mouseY * 60 - (scrollY * 0.15) % height) * scale2;

            const dx = projX - projX2;
            const dy = projY - projY2;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
              const alpha = (1 - dist / 120) * 0.15 * scale;
              ctx.strokeStyle = `rgba(130, 255, 0, ${alpha})`;
              ctx.lineWidth = 0.6 * scale;
              ctx.beginPath();
              ctx.moveTo(projX, projY);
              ctx.lineTo(projX2, projY2);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-85"
      aria-hidden="true"
    />
  );
}
