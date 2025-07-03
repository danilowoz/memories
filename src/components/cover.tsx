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

    return (
      <>
        {leftSide && <div className="opacity-40">Memories</div>}
        <div className="text-white opacity-20">
          {name.replace("Memories", "")}
        </div>
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
        className={cn(
          "absolute inset-0 md:inset-6 md:bottom-13 md:rounded bg-center saturate-20 bg-cover",
        )}
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px) saturate(60%)" }}
        transition={{
          ease: "easeInOut",
          delay: 0.6,
          duration: 0.6,
        }}
      />
      <motion.div
        style={{ backgroundColor: "var(--color)" }}
        className={cn(
          "absolute inset-0 top-0 md:inset-6 md:bottom-13 opacity-70 md:rounded",
        )}
        initial={{
          margin: "-26px -26px -56px -26px",
          opacity: 1,
          borderRadius: 0,
          filter: "saturate(50%)",
        }}
        animate={{
          margin: 0,
          opacity: 0.3,
          borderRadius: 8,
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
        transition={{
          ease: "easeInOut",
          delay: 1,
          duration: 0.6,
        }}
        className={cn(
          "text-[30px] p-40 font-heading md:text-4xl text-gray-50 mix-blend-plus-lighter flex gap-1 relative m-auto",
        )}
      >
        {renderTitle()}
      </motion.h1>
    </>
  );
};
