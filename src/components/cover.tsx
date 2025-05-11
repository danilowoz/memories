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
      <motion.div
        style={{
          backgroundImage: `url(${src})`,
        }}
        className={cn(
          "absolute inset-0 md:inset-6 md:bottom-12 md:rounded-lg bg-center saturate-20 bg-cover",
        )}
        initial={{ opacity: 0, filter: "blur(10px) saturate(20%)" }}
        animate={{ opacity: 1, filter: "blur(0px) saturate(20%)" }}
        transition={{
          ease: "easeInOut",
          delay: 0.6,
          duration: 0.6,
        }}
      />
      <motion.div
        style={{ backgroundColor: "var(--color)" }}
        className={cn(
          "absolute inset-0 top-0 md:inset-6 md:bottom-12 md:rounded-lg opacity-70",
        )}
        initial={{
          margin: "-26px -26px -50px -26px",
          opacity: 1,
          borderRadius: 0,
        }}
        animate={{ margin: 0, opacity: 0.7, borderRadius: 8 }}
        transition={{
          ease: "easeInOut",
          delay: 0.5,
          duration: 0.6,
        }}
      />

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          ease: "easeInOut",
          delay: 1,
          duration: 0.6,
        }}
        className="text-[30px] m-auto font-serif md:text-[60px] text-gray-50 mix-blend-plus-lighter flex gap-3 relative"
      >
        {renderTitle()}
      </motion.h1>
    </>
  );
};
