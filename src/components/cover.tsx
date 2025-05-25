"use client";

import { cn } from "@/utils/classname";
import { motion } from "framer-motion";

export const Cover = ({
  src,
  name,
  titlePosition,
}: {
  src: string;
  name: string;
  titlePosition: string;
}) => {
  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    return (
      <>
        {leftSide && <div className="opacity-60">Memories</div>}
        <div
          className={cn(
            "bg-clip-text text-transparent from-[#ffffff50] to-[#ffffff] blur-[.5px] opacity-50 pr-2.5",
            {
              "bg-gradient-to-bl": !leftSide,
              "bg-gradient-to-r": leftSide,
            },
          )}
        >
          {name.replace("Memories", "")}
        </div>
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
        className={cn(
          "absolute inset-0 md:inset-6 md:bottom-13 md:rounded-lg bg-center saturate-20 bg-cover",
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
          "absolute inset-0 top-0 md:inset-6 md:bottom-13 md:rounded-lg opacity-70 mix-blend-color",
        )}
        initial={{
          margin: "-26px -26px -56px -26px",
          opacity: 1,
          borderRadius: 0,
        }}
        animate={{ margin: 0, opacity: 0.3, borderRadius: 8 }}
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
        className={cn(
          "text-[30px] p-40 font-heading md:text-[72px] text-gray-50 mix-blend-plus-lighter flex gap-3 relative",
          titlePosition,
        )}
      >
        {renderTitle()}
      </motion.h1>
    </>
  );
};
