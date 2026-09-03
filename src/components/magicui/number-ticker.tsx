/**
 * NumberTicker — https://magicui.design/docs/components/number-ticker
 * Adaptado: sem "use client", com prop `format` (ex: moeda BRL) e respeito a
 * prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps extends React.ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  /** Formatação final do número. Sobrepõe decimalPlaces quando presente. */
  format?: (n: number) => string;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  format,
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const render = (n: number) =>
    format
      ? format(n)
      : Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(n.toFixed(decimalPlaces)));

  useEffect(() => {
    if (reduce || !isInView) return;
    const timer = setTimeout(() => {
      motionValue.set(direction === "down" ? startValue : value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value, direction, startValue, reduce]);

  useEffect(() => {
    if (reduce) return;
    return springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = render(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue, decimalPlaces, format, reduce]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums tracking-tight", className)}
      {...props}
    >
      {render(reduce || direction === "down" ? value : startValue)}
    </span>
  );
}
