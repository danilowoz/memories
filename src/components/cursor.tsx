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
  const { overObject, windowWidth } = React.useContext(context);

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

        cursorRef.current.style.left = `${event.clientX - SIZE / 2}px`;
        cursorRef.current.style.top = `${limit ? window.innerHeight - threshold * 1.3 : top}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [timelineContainerWidth, windowWidth]);

  return (
    <motion.div
      ref={cursorRef}
      animate={{
        width: overTimeline ? 2 : SIZE,
        height: overTimeline ? SIZE * 4 : SIZE,
        opacity: overObject === "image" ? 0.3 : 1,
        scale: overObject === "image" ? 2 : 1,
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
        overTimeline ? "border-black/50" : "",
      )}
    >
      <div
        id="cursor-scroll"
        className="w-40 h-full relative after:content-[''] after:absolute after:inset-0 after:backdrop-blur-[4px] z-10"
      >
        <div
          className={cn(
            "overflow-auto w-40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative",
          )}
          ref={scrollRef}
        >
          <div
            className="flex text-nowrap pt-6 gap-6 "
            style={{ width: timelineContainerWidth }}
          >
            {payload.map((item, index) => (
              <motion.div
                key={item.id}
                style={{ flexGrow: albumSizes[index][0] }}
                className="h-5 flex-1"
              >
                <span className="sticky left-2">
                  {item.name.replace("Memories", "").trim()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
