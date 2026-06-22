"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

type SplineSceneProps = {
  scene: string;
  className?: string;
};

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div
          className={`${className ?? ""} flex items-center justify-center bg-transparent`}
          aria-busy="true"
        >
          <span className="block h-3 w-3 animate-pulse rounded-full bg-[var(--color-signal)]/60" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
