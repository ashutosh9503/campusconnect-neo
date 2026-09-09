import React, { useMemo, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PhysicsNodeType = "boba" | "spin" | "bounce" | "float" | "flip" | "wobble";

interface ShakePhysicsNodeProps {
  children: ReactNode;
  type?: PhysicsNodeType;
  className?: string;
  factor?: number; // Physics responsiveness multiplier
}

export function ShakePhysicsNode({
  children,
  type = "boba",
  className,
  factor = 1,
}: ShakePhysicsNodeProps) {
  // Generate random physics seeds once on mount for each independent component
  const randomStyle = useMemo(() => {
    const seedX = (Math.random() * 1.6 - 0.8).toFixed(2);
    const seedY = (Math.random() * 1.6 - 0.8).toFixed(2);
    const seedRx = (Math.random() * 2 - 1).toFixed(2);
    const seedRy = (Math.random() * 2 - 1).toFixed(2);
    const seedRz = (Math.random() * 2 - 1).toFixed(2);
    const seedR = (Math.random() * 2 - 1).toFixed(2);

    return {
      "--seed-x": seedX,
      "--seed-y": seedY,
      "--seed-rx": seedRx,
      "--seed-ry": seedRy,
      "--seed-rz": seedRz,
      "--seed-r": seedR,
      "--physics-factor": factor.toFixed(2),
    } as React.CSSProperties;
  }, [factor]);

  const typeClass = {
    boba: "physics-boba",
    spin: "physics-spin",
    bounce: "physics-bounce",
    float: "physics-float",
    flip: "physics-flip",
    wobble: "physics-wobble",
  }[type];

  return (
    <div
      style={randomStyle}
      className={cn("physics-node", typeClass, className)}
    >
      {children}
    </div>
  );
}
