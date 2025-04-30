"use client";

import { cn } from "@/utils/classname";
import { motion } from "framer-motion";

const THEME_ANIMATION = {
  initial: { opacity: 0, filter: "blur(5px)", x: -20 },
  whileInView: { opacity: 0.4, filter: "blur(.5px)", x: 0 },
  transition: { type: "spring", duration: 1, bounce: 0 },
  viewport: { amount: 1 },
};

const TITLE_ANIMATION = {
  initial: { opacity: 0.1 },
  whileInView: { opacity: 0.45 },
  transition: { type: "spring", duration: 1.4, bounce: 0 },
  viewport: { amount: 1 },
};

export const Cover = ({
  src,
  name,
}: {
  src: string;
  name: string;
}) => {
  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    return (
      <>
        {leftSide && <motion.div {...TITLE_ANIMATION}>Memories</motion.div>}
        <motion.div
          {...THEME_ANIMATION}
          initial={{ ...THEME_ANIMATION.initial, x: leftSide ? -20 : 20 }}
          className={cn(
            "bg-clip-text text-transparent from-[#ffffff50] to-[#ffffff90]",
            {
              "bg-gradient-to-bl": !leftSide,
              "bg-gradient-to-r": leftSide,
            },
          )}
        >
          {name.replace("Memories", "")}
        </motion.div>
        {!leftSide && <motion.div {...TITLE_ANIMATION}>Memories</motion.div>}
      </>
    );
  };

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${src})`,
        }}
        className={cn(
          "absolute inset-0 md:inset-6 md:bottom-12 md:rounded-lg bg-center saturate-20 bg-cover",
        )}
      />
      <div
        style={{ backgroundColor: "var(--color)" }}
        className={cn(
          "absolute inset-0 top-0 md:inset-6 md:bottom-12 md:rounded-lg opacity-70",
        )}
      />

      <h2 className="text-[30px] m-auto font-serif md:text-[60px] text-gray-50 mix-blend-plus-lighter flex gap-3 relative">
        {renderTitle()}
      </h2>
    </>
  );
};
