"use client";

import { COLORS } from "@/styles/colors";
import { useIsSafari } from "@/utils/browser";
import { motion, useTransform } from "motion/react";
import React from "react";
import { context } from "./context";

export const Cover = ({
  albumIndex,
  src,
  name,
}: {
  albumIndex: number;
  src: string;
  name: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollX, windowWidth, setLayout, layout, setEnableDarkMode } =
    React.useContext(context);
  const isMobile = windowWidth < 768;
  const [scrollDirection, setScrollDirection] = React.useState<
    "left" | "right"
  >("right");
  const safari = useIsSafari();

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
        {leftSide && <div className="opacity-60">Memories</div>}
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
        {!leftSide && <div className="opacity-60">Memories</div>}
      </>
    );
  };

  return (
    <>
      <motion.div
        style={{
          backgroundImage: `url(${src})`,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: layout === "list" ? 1 : 0,
        }}
        id={`horizontal-${albumIndex}`}
        className="absolute inset-0 md:inset-6 md:bottom-16 md:rounded bg-center bg-cover saturate-40 brightness-5-0"
        ref={ref}
      />
      <motion.div
        style={{ backgroundColor: COLORS[albumIndex % COLORS.length] }}
        className="absolute inset-0 top-0 md:inset-6 md:bottom-16 opacity-70 md:rounded cursor-pointer"
        initial={{
          opacity: layout === "list" ? 0.4 : 0,
          filter: "saturate(50%)",
        }}
        animate={{
          opacity: layout === "list" ? 0.4 : 0,
          filter: "saturate(100%)",
        }}
        transition={{
          ease: "easeInOut",
          duration: 0.2,
        }}
        onClick={() => {
          const controller = new AbortController();
          const readMessage = () => {
            window.dispatchEvent(
              new CustomEvent("image-clicked", { detail: albumIndex }),
            );

            controller.abort();
          };

          window.addEventListener("grid-loaded", readMessage, {
            signal: controller.signal,
          });

          setLayout("grid");
          setEnableDarkMode(false);
        }}
      />

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          ease: "easeInOut",
          delay: 0.2,
          duration: 0.6,
        }}
        className="text-[30px] md:p-40 font-heading md:text-4xl text-neutral-50 mix-blend-plus-lighter flex gap-1 relative m-auto pointer-events-none"
      >
        {renderTitle()}
      </motion.h1>
    </>
  );
};
