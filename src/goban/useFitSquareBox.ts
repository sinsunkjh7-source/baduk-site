import { useLayoutEffect, useState, type RefObject } from "react";

interface FitSquareBoxOptions {
  /** Stable wrapper that contains the board (used to measure available width and the
   * board's vertical position — must NOT itself be resized based on this hook's output). */
  containerRef: RefObject<HTMLElement | null>;
  /** Content above the board inside containerRef (title, toolbars, nav), whose height must
   * also be subtracted from the available vertical space. */
  aboveRef?: RefObject<HTMLElement | null>;
  /** Content below the board inside containerRef (status text, controls). */
  belowRef?: RefObject<HTMLElement | null>;
  minPx?: number;
  /** Extra values that should trigger a recompute beyond resize/ResizeObserver (e.g. content
   * that changes the above/below refs' height without the elements themselves resizing). */
  deps?: unknown[];
}

/**
 * Measures the biggest square (in pixels) that fits the space left after everything else in
 * `containerRef`. The board itself should then be sized to exactly this box and let the SVG's
 * own viewBox scaling (width/height: 100% in CSS) fill it — that's what actually guarantees no
 * clipping/distortion, this hook only figures out how big the box should be.
 */
export function useFitSquareBox({
  containerRef,
  aboveRef,
  belowRef,
  minPx = 200,
  deps = [],
}: FitSquareBoxOptions): number {
  const [sizePx, setSizePx] = useState(400);

  useLayoutEffect(() => {
    const SAFETY_MARGIN = 16;

    function compute(): number {
      const containerEl = containerRef.current;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const containerWidth = containerEl?.clientWidth ?? window.innerWidth;
      const availableWidth = containerWidth - scrollbarWidth - SAFETY_MARGIN;

      const containerTop = containerEl?.getBoundingClientRect().top ?? 64;
      const aboveHeight = aboveRef?.current?.getBoundingClientRect().height ?? 0;
      const belowHeight = belowRef?.current?.getBoundingClientRect().height ?? 0;
      const appRootEl = document.querySelector(".app-root");
      const appRootStyle = appRootEl ? getComputedStyle(appRootEl) : null;
      const appRootBottomPadding = appRootStyle ? parseFloat(appRootStyle.paddingBottom) || 0 : 0;
      const availableHeight =
        window.innerHeight - containerTop - aboveHeight - belowHeight - appRootBottomPadding - SAFETY_MARGIN;

      return Math.max(minPx, Math.min(availableWidth, availableHeight));
    }

    function apply() {
      setSizePx(compute());
    }

    apply();
    window.addEventListener("resize", apply);
    const observer = new ResizeObserver(apply);
    if (containerRef.current) observer.observe(containerRef.current);
    if (aboveRef?.current) observer.observe(aboveRef.current);
    if (belowRef?.current) observer.observe(belowRef.current);
    return () => {
      window.removeEventListener("resize", apply);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return sizePx;
}
