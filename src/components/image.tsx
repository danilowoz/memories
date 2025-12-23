"use client";

import { useIsSafari } from "@/utils/browser";
import { cn } from "@/utils/classname";
import { formatDate } from "@/utils/date";
import { AnimatePresence, motion } from "motion/react";
import NextjsImage from "next/image";
import React from "react";
import { context } from "./context";

const MotionImage = motion.create(NextjsImage);

export const Image = ({
  src,
  alt,
  location,
  date,
  dark,
  format,
}: {
  src: string;
  alt: string;
  className?: string;
  location: string;
  date: string;
  dark: boolean;
  format: "landscape" | "portrait";
}) => {
  const { setLayout, layout, setEnableDarkMode, setClickedId } =
    React.useContext(context);
  const safari = useIsSafari();

  return (
    <>
      <motion.div
        key={safari ? "safari" : "other"}
        className="mt-6 pb-22 md:px-36"
        initial={safari ? undefined : { filter: "blur(20px)", opacity: 0.2 }}
        whileInView={{
          filter: "blur(0px)",
          opacity: layout === "list" ? 1 : 0,
        }}
        transition={
          safari
            ? undefined
            : {
                type: "spring",
                duration: 0.3,
                bounce: 0,
                delay: layout === "list" ? 0 : 1,
              }
        }
        viewport={safari ? undefined : { amount: 0.1 }}
      >
        <MotionImage
          layoutDependency={layout}
          id={`horizontal-${src}`}
          layoutId={src}
          width={format === "landscape" ? 1024 : 1024}
          height={format === "landscape" ? 1536 : 1536}
          className="w-full md:w-auto md:h-full max-w-none transform-gpu cursor-pointer rounded-sm will-change-transform"
          src={src}
          alt={alt ?? "Image"}
          priority
          quality={100}
          loading="eager"
          onClick={() => {
            if (window.matchMedia("(min-width: 768px)").matches) {
              const controller = new AbortController();
              const readMessage = () => {
                window.dispatchEvent(
                  new CustomEvent("image-clicked", { detail: src }),
                );

                controller.abort();
              };

              window.addEventListener("grid-loaded", readMessage, {
                signal: controller.signal,
              });

              setLayout("grid");
              setClickedId(src);
              setEnableDarkMode(false);
            }
          }}
        />

        <AnimatePresence initial={false}>
          {location && date && layout === "list" && (
            <motion.figcaption
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:pt-2 md:p-0 flex gap-2"
            >
              <motion.p
                initial={safari ? undefined : { opacity: 0, y: -2 }}
                whileInView={safari ? undefined : { opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                viewport={safari ? undefined : { amount: 0.5 }}
                className={cn("text-neutral-900 m-0 text-sm font-display", {
                  "text-white": dark,
                })}
              >
                {location}
              </motion.p>
              <motion.p
                initial={safari ? undefined : { opacity: 0, y: -4 }}
                whileInView={safari ? undefined : { opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                viewport={safari ? undefined : { amount: 0.5 }}
                className={cn("text-neutral-900/50 m-0 text-sm", {
                  "text-white opacity-50": dark,
                })}
              >
                {formatDate(date)}
              </motion.p>
            </motion.figcaption>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
