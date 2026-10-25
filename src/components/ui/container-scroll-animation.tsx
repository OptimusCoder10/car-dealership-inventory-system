"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';

type ContainerScrollProps = {
  titleComponent: ReactNode;
  children: ReactNode;
};

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], [isMobile ? 10 : 16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [isMobile ? 0.94 : 0.9, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [32, 0]);

  return (
    <section ref={containerRef} className="relative flex min-h-[42rem] items-center justify-center overflow-hidden px-5 py-20 md:min-h-[56rem] md:px-10" aria-label="A closer look at Drivewell">
      <div className="w-full max-w-6xl" style={{ perspective: '1000px' }}>
        <Header translate={translate} titleComponent={titleComponent} reduceMotion={Boolean(reduceMotion)} />
        <Card rotate={rotate} scale={scale} reduceMotion={Boolean(reduceMotion)}>{children}</Card>
      </div>
    </section>
  );
}

export function Header({ translate, titleComponent, reduceMotion = false }: {
  translate: MotionValue<number>;
  titleComponent: ReactNode;
  reduceMotion?: boolean;
}) {
  return <motion.div style={reduceMotion ? undefined : { translateY: translate }} className="mx-auto mb-10 max-w-3xl text-center md:mb-14">{titleComponent}</motion.div>;
}

export function Card({ rotate, scale, children, reduceMotion = false }: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: ReactNode;
  reduceMotion?: boolean;
}) {
  return (
    <motion.div
      style={reduceMotion ? undefined : { rotateX: rotate, scale }}
      className="mx-auto w-full max-w-5xl rounded-[22px] border-[7px] border-[var(--midnight-blue)] bg-[var(--midnight-blue)] p-1 shadow-[0_32px_80px_#0f1a2b33] md:rounded-[30px] md:border-[12px] md:p-2"
    >
      <div className="h-[24rem] overflow-hidden rounded-[13px] bg-[var(--deep-navy)] md:h-[34rem] md:rounded-[16px]">
        {children}
      </div>
    </motion.div>
  );
}
