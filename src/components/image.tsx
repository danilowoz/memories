"use client";

import { cn } from "@/utils/classname";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

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
            className={cn("fixed inset-0 bg-white z-40 cursor-pointer", {
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
              className="cursor-pointer"
              layoutId={src}
              src={src}
              alt={alt}
              onClick={() => setShow(false)}
              style={{
                height: window.innerHeight,
                width: window.innerHeight * ratio,
              }}
              transition={{ type: "spring", duration: 1, bounce: 0.1 }}
            />

            {/* <div>
              <p
                className={cn("text-gray-600 font-semibold m-0", {
                  "text-white": dark,
                })}
              >
                {location}
              </p>
              <p
                className={cn("text-gray-400 uppercase m-0 text-xs", {
                  "text-white opacity-50": dark,
                })}
              >
                {formatDate(date)}
              </p>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="m-auto md:px-40"
        initial={{ filter: "blur(10px)", opacity: 0.2 }}
        whileInView={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        viewport={{ amount: 0.1 }}
      >
        <motion.img
          layoutId={src}
          className="w-full md:w-auto md:h-[80vh] max-w-none transform-gpu cursor-pointer"
          src={src}
          alt={alt}
          onClick={(event: React.MouseEvent<HTMLImageElement>) => {
            const size = event.currentTarget.getBoundingClientRect();
            const aspectRatio = size.width / size.height;

            setRatio(aspectRatio);
            setShow(true);
          }}
        />

        {location && date && (
          <figcaption className="p-4 md:pt-2 md:p-0 flex gap-2">
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              viewport={{ amount: 0.5 }}
              className={cn("text-gray-900 m-0 text-sm font-display", {
                "text-white": dark,
              })}
            >
              {location}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              viewport={{ amount: 0.5 }}
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
