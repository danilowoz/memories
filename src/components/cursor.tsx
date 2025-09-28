"use client";

import payload from "@/data.json";
import { cn } from "@/utils/classname";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import React from "react";
import { context } from "./context";

const SIZE = 20;

export const Cursor = ({
  albumSizes,
  timelineContainerWidth,
}: { albumSizes: [number, number][]; timelineContainerWidth: number }) => {
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [overTimeline, setOverTimeline] = React.useState(false);
  const { overObject, mouseX } = React.useContext(context);

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (cursorRef.current) {
        const threshold = 60;
        const top = event.clientY - SIZE / 2;
        const limit = top + threshold > window.innerHeight;

        if (scrollRef.current) {
          scrollRef.current?.scrollTo({
            left: event.clientX - 76,
          });
        }

        setOverTimeline(limit);

        if (limit) {
          mouseX.set(event.clientX - 76);
        } else {
          mouseX.set(0);
        }

        cursorRef.current.style.left = `${event.clientX - SIZE / 2}px`;
        cursorRef.current.style.top = `${limit ? window.innerHeight - 48 : top}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={cursorRef}
      initial={{ opacity: 0, width: 0, height: 0 }}
      animate={{
        width: overTimeline ? 12 : SIZE,
        height: overTimeline ? SIZE * 2.2 : SIZE,
        opacity: overObject === "image" ? 0.3 : 1,
        scale: overObject === "image" ? 1.5 : 1,
      }}
      transition={{
        width: {
          duration: 0.1,
          ease: "easeInOut",
        },
      }}
      className={cn(
        "cursor fixed pointer-events-none z-50",
        "bg-gray-200/50 border border-gray-300 rounded-full w-full h-full backdrop-blur-sm",
        {
          "after:content-[''] after:absolute after:bottom-0 after:right-0 after:translate-x-2 after:translate-y-1 after:w-2 after:h-0.5 after:bg-gray-200/50 after:rotate-45 after:rounded-2xl after:border after:border-gray-300":
            overObject === "image",

          "border-white bg-gray-300 border-5": overTimeline,
        },
      )}
    >
      <AnimatePresence>
        {overTimeline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { delay: 0.2, duration: 0.2 },
            }}
            exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
            className="w-24 h-full relative"
          >
            <div
              id="cursor-scroll"
              className="overflow-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -top-1.5 relative"
              ref={scrollRef}
            >
              <div
                className="flex text-nowrap gap-6"
                style={{ width: timelineContainerWidth }}
              >
                {payload.map((item, index) => (
                  <motion.div
                    key={item.id}
                    style={{ flexGrow: albumSizes[index][0] }}
                    className="h-5 flex-1"
                  >
                    <span className="sticky left-2 top-0 text-sm leading-0 text-gray-900/90">
                      {item.name.replace("Memories", "").trim()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
