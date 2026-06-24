"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function PulsingCard({
  children,
  delay,
  duration = 0.9,
  cycleSec = 5.5,
  accent = "signal",
}: {
  children: ReactNode;
  delay: number;
  duration?: number;
  cycleSec?: number;
  accent?: "signal" | "gold";
}) {
  // Cor signal verde ou gold pro glow ao pulsar
  const corPulse = accent === "gold" ? "#FFD93D" : "#3CFF8A";
  return (
    <motion.div
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(0,0,0,0)",
          `0 0 32px 6px ${corPulse}99, 0 0 80px 12px ${corPulse}33`,
          "0 0 0 0 rgba(0,0,0,0)",
        ],
        scale: [1, 1.015, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: cycleSec - duration,
        ease: "easeOut",
        times: [0, 0.5, 1],
      }}
      className="rounded-2xl"
    >
      {children}
    </motion.div>
  );
}
