"use client";

import { cn } from "@/utils/classname";
import { motion } from "framer-motion";

export const Cover = ({
  src,
  name,
}: {
  src: string;
  name: string;
}) => {
  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    if (leftSide) {
      return (
        <>
          <span>Memories</span>
          <span className="opacity-30">{name.replace("Memories", "")}</span>
        </>
      );
    }

    return (
      <>
        <span className="opacity-30">{name.replace("Memories", "")}</span>
        <span>Memories</span>
      </>
    );
  };

  return (
    <>
      <motion.div
        style={{
          backgroundImage: `url(${src})`,
        }}
        className={cn(
          "absolute inset-0 md:inset-6 md:bottom-12 md:rounded-lg bg-center saturate-20 bg-cover",
        )}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        viewport={{ amount: 0.2 }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.7 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        viewport={{ amount: 0.2 }}
        style={{ backgroundColor: "var(--color)" }}
        className={cn(
          "absolute inset-0 top-0 md:inset-6 md:bottom-12 md:rounded-lg opacity-70",
        )}
      />

      <motion.h2 className="text-[30px] m-auto font-serif md:text-[60px] text-gray-50 mix-blend-plus-lighter">
        {renderTitle()}
      </motion.h2>
    </>
  );
};
