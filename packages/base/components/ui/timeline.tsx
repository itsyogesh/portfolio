'use client';

import { useScroll, useTransform, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@packages/base/lib/utils';

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

function Timeline({
  data,
  className,
}: {
  data: TimelineEntry[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      <div ref={ref} className="relative">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex gap-6 pb-8 last:pb-0"
          >
            {/* Dot */}
            <div className="relative flex flex-col items-center pt-1.5">
              <div className="relative z-10 flex h-3 w-3 shrink-0 items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full border border-border bg-muted" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-medium text-sm">{item.title}</h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Track line */}
        <div
          style={{ height: `${height}px` }}
          className="absolute left-[5px] top-0 w-px overflow-hidden bg-border/50 [mask-image:linear-gradient(to_bottom,transparent_0%,black_5%,black_95%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-px rounded-full bg-gradient-to-t from-primary via-primary/60 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

export { Timeline, type TimelineEntry };
