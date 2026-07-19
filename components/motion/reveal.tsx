"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";
import {
  chainContainer,
  chainItem,
  easePremium,
  revealVariants,
  springs,
} from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before enter (seconds). */
  delay?: number;
  /** Once in view — default true (calm, no re-bounce). */
  once?: boolean;
  as?: "div" | "section" | "li" | "article";
} & Omit<HTMLMotionProps<"div">, "children" | "className">;

/**
 * Opt-in scroll reveal — quiet opacity + y. Do not wrap every card;
 * dense dashboards should stay still (fatigue).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  as = "div",
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px -6% 0px" });
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;

  return (
    <Comp
      ref={ref}
      className={cn(className)}
      initial={reduce ? false : "hidden"}
      animate={reduce || inView ? "show" : "hidden"}
      variants={{
        hidden: revealVariants.hidden,
        show: {
          ...revealVariants.show,
          transition: {
            duration: reduce ? 0 : 0.52,
            ease: easePremium,
            delay: reduce ? 0 : delay,
            ...(!reduce ? {} : {}),
          },
        },
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * Zincir: çocuklar sırayla yükselir — bölümler birbirini “çağırır”.
 * Children should be direct motion-capable nodes or wrapped in RevealChainItem.
 */
export function RevealChain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px -4% 0px" });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      variants={chainContainer}
      initial={reduce ? false : "hidden"}
      animate={reduce || inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function RevealChainItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={reduce ? undefined : chainItem}
      transition={reduce ? { duration: 0 } : springs.calm}
    >
      {children}
    </motion.div>
  );
}
