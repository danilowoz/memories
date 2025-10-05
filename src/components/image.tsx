"use client";

import { useIsSafari } from "@/utils/browser";
import { cn } from "@/utils/classname";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { context } from "./context";

export const Image = ({
  src,
  alt,
  location,
  date,
  dark,
}: {
  src: string;
  alt: string;
  className?: string;
  location: string;
  date: string;
  dark: boolean;
}) => {
  const [show, setShow] = React.useState(false);
  const [ratio, setRatio] = React.useState(1);
  const { setOverObject } = React.useContext(context);

  const safari = useIsSafari();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShow(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <AnimatePresence>
        {show ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 bg-white z-40 ", {
              "bg-black": dark,
            })}
            onClick={() => setShow(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {show && (
          <motion.div
            className={cn("fixed inset-0 z-50 flex p-7- justify-around")}
          >
            <motion.img
              layoutId={src}
              src={src}
              alt={alt}
              onClick={() => setShow(false)}
              style={{
                height: window.innerHeight,
                width: window.innerHeight * ratio,
              }}
              transition={{ type: "spring", duration: 1, bounce: 0.1 }}
              onMouseEnter={() => setOverObject("image")}
              onMouseLeave={() => setOverObject(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={safari ? "safari" : "other"}
        className="m-auto md:px-40"
        initial={safari ? undefined : { filter: "blur(20px)", opacity: 0.2 }}
        whileInView={{ filter: "blur(0px)", opacity: 1 }}
        transition={
          safari ? undefined : { type: "spring", duration: 0.3, bounce: 0 }
        }
        viewport={safari ? undefined : { amount: 0.1 }}
      >
        <motion.img
          layoutId={src}
          className="w-full md:w-auto md:h-[80vh] max-w-none transform-gpu "
          src={src}
          alt={alt}
          onClick={(event: React.MouseEvent<HTMLImageElement>) => {
            const size = event.currentTarget.getBoundingClientRect();
            const aspectRatio = size.width / size.height;

            setRatio(aspectRatio);
            setShow(true);
            setOverObject(null);
          }}
          onMouseEnter={() => setOverObject("image")}
          onMouseLeave={() => setOverObject(null)}
        />

        {location && date && (
          <figcaption className="p-4 md:pt-2 md:p-0 flex gap-2">
            <motion.p
              initial={safari ? undefined : { opacity: 0, y: -2 }}
              whileInView={safari ? undefined : { opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              viewport={safari ? undefined : { amount: 0.5 }}
              className={cn("text-gray-900 m-0 text-sm font-display", {
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
              className={cn("text-gray-900/50 m-0 text-sm", {
                "text-white opacity-50": dark,
              })}
            >
              {formatDate(date)}
            </motion.p>
          </figcaption>
        )}
      </motion.div>
    </>
  );
};

function formatDate(date: string) {
  const fullDate = new Date(date);

  const month = fullDate.toLocaleDateString("en-US", {
    month: "short",
  });

  const year = fullDate.toLocaleDateString("en-US", {
    year: "numeric",
  });

  return `${month}, ${year}`;
}
