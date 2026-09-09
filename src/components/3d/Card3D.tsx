import React, { useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Card3DProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: "lime" | "purple" | "white";
  scaleOnHover?: boolean;
  depth?: number;
}

export function Card3D({
  children,
  className,
  maxTilt = 8,
  glowColor = "lime",
  scaleOnHover = true,
  depth = 15,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
    transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
  });

  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 80%)",
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    // Skip tilt calculation on touch devices for fluid scroll
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse position relative to center of card (-1 to 1)
    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    const rotateX = -mouseY * maxTilt;
    const rotateY = mouseX * maxTilt;

    const shadowX = -mouseX * 10 + 4;
    const shadowY = -mouseY * 10 + 4;

    const shadowColor =
      glowColor === "lime"
        ? "hsl(var(--primary))"
        : glowColor === "purple"
        ? "hsl(var(--secondary))"
        : "hsl(var(--foreground))";

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
        2
      )}deg) translateZ(${depth}px) ${scaleOnHover ? "scale3d(1.02, 1.02, 1.02)" : ""}`,
      boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 0px ${shadowColor}, ${
        glowColor === "lime"
          ? "0 12px 28px rgba(130, 255, 0, 0.25)"
          : glowColor === "purple"
          ? "0 12px 28px rgba(160, 32, 240, 0.3)"
          : "0 12px 28px rgba(0, 0, 0, 0.7)"
      }`,
      transition: "transform 0.1s ease-out, box-shadow 0.1s ease-out",
    });

    // Update specular glare
    const glareX = ((e.clientX - rect.left) / width) * 100;
    const glareY = ((e.clientY - rect.top) / height) * 100;

    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.12) 0%, transparent 70%)`,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)",
      boxShadow: "",
      transition: "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
    });
    setGlareStyle((prev) => ({
      ...prev,
      opacity: 0,
    }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={cn("transform-style-3d relative transition-all", className)}
    >
      {/* Specular Glare Highlight */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
        style={glareStyle}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
