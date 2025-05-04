"use client";

import { cn } from "@/utils/classname";
import { motion } from "framer-motion";

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
  return (
    <motion.div
      className="image-wrapper m-auto md:px-40"
      initial={{ filter: "blur(10px)", opacity: 0.2 }}
      whileInView={{ filter: "blur(0px)", opacity: 1 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      viewport={{ amount: 0.1 }}
    >
      <motion.img
        className="w-full md:w-auto md:h-[80vh] max-w-none md:rounded transform-gpu"
        src={src}
        alt={alt}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      />

      {location && date && (
        <figcaption className="p-4 md:pt-4 md:p-0">
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            viewport={{ amount: 0.5 }}
            className={cn("text-gray-600 font-semibold m-0", {
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
            className={cn("text-gray-400 uppercase m-0 text-xs", {
              "text-white opacity-50": dark,
            })}
          >
            {formatDate(date)}
          </motion.p>
        </figcaption>
      )}
    </motion.div>
  );
};

function formatDate(date: string) {
  const fullDate = new Date(date);

  const month = fullDate.toLocaleDateString("en-US", {
    month: "long",
  });

  const year = fullDate.toLocaleDateString("en-US", {
    year: "numeric",
  });

  return `${month}, ${year}`;
}
