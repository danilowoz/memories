"use client";

import { useIsSafari } from "@/utils/browser";
import { cn } from "@/utils/classname";
import { motion, useScroll, useTransform } from "framer-motion";
import React from "react";
import { context } from "./context";

export const Cover = ({
  coverId,
  src,
  name,
}: {
  coverId: string;
  src: string;
  name: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [offsetLeft, setOffsetLeft] = React.useState(0);
  const { scrollX, windowWidth } = React.useContext(context);
  const isMobile = windowWidth < 768;
  const x = useTransform(
    scrollX,
    [offsetLeft - windowWidth, offsetLeft + windowWidth * 2],
    [windowWidth / 20, -windowWidth / 10],
  );
  const [scrollDirection, setScrollDirection] = React.useState<
    "left" | "right"
  >("right");
  const safari = useIsSafari();

  React.useLayoutEffect(() => {
    setOffsetLeft((ref.current?.parentNode as HTMLElement)?.offsetLeft ?? 0);
  }, []);

  scrollX.on("change", (value) => {
    if (safari) {
      return;
    }

    if (value > (scrollX.getPrevious() ?? 0)) {
      setScrollDirection("right");
    } else {
      setScrollDirection("left");
    }
  });

  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    return (
      <>
        {leftSide && <div className="opacity-40">Memories</div>}
        <motion.div
          className="text-white opacity-20 whitespace-pre"
          initial={safari ? undefined : "initial"}
          whileInView={safari ? undefined : "whileInView"}
          viewport={
            safari
              ? undefined
              : { amount: 0.8, margin: `-${windowWidth / 10}px` }
          }
        >
          {isMobile || safari
            ? name.replace("Memories", "")
            : name
                .replace("Memories", "")
                .split("")
                .map((char, index, arr) => (
                  <motion.span
                    transition={{
                      type: "spring",
                      duration: 1,
                      bounce: 0,
                      delay:
                        scrollDirection === "right"
                          ? index * 0.05
                          : arr.length * 0.05 - index * 0.05,
                    }}
                    variants={{
                      initial: {
                        opacity: 0,
                        scale: 1.1,
                        filter: "blur(10px)",
                      },
                      whileInView: {
                        opacity: 1,
                        scale: 1,
                        filter: "blur(0px)",
                      },
                      exit: { opacity: 0, scale: 1.1, filter: "blur(10px)" },
                    }}
                    key={char + index}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
        </motion.div>
        {!leftSide && <div className="opacity-40">Memories</div>}
      </>
    );
  };

  return (
    <>
      <motion.div
        style={{
          backgroundImage: `url(${src})`,
        }}
        id={`horizontal-${coverId}`}
        className="absolute inset-0 md:inset-6 md:bottom-13 md:rounded bg-center saturate-20 bg-cover"
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px) saturate(60%)" }}
        transition={{
          ease: "easeInOut",
          delay: 0.6,
          duration: 0.6,
        }}
        ref={ref}
      />
      <motion.div
        style={{ backgroundColor: "var(--color)" }}
        className="absolute inset-0 top-0 md:inset-6 md:bottom-13 opacity-70 md:rounded"
        initial={{
          opacity: 1,
          filter: "saturate(50%)",
        }}
        animate={{
          opacity: 0.3,
          filter: "saturate(100%)",
        }}
        transition={{
          ease: "easeInOut",
          delay: 0.5,
          duration: 0.6,
        }}
      />

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ left: isMobile ? 0 : x }}
        transition={{
          ease: "easeInOut",
          delay: 1,
          duration: 0.6,
        }}
        className="text-[30px] md:p-40 font-heading md:text-4xl text-gray-50 mix-blend-plus-lighter flex gap-1 relative m-auto"
      >
        {renderTitle()}
      </motion.h1>
    </>
  );
};
