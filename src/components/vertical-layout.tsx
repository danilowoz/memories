"use client";

import payload from "@/data.json";
import { AnimatePresence, motion } from "framer-motion";
import NextjsImage from "next/image";
import React from "react";
import { context } from "./context";

const MotionImage = motion.create(NextjsImage);

export const VerticalLayout = () => {
  const { layout, setLayout } = React.useContext(context);

  return (
    <>
      <AnimatePresence>
        {layout === "vertical" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 bg-white z-10 cursor-pointer"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {layout === "vertical" && (
          <div className="fixed inset-0 overflow-auto z-20 grid grid-cols-4 gap-4 py-4">
            {payload.map((album) => (
              <React.Fragment key={album.id}>
                <div
                  style={
                    {
                      "--color": `var(--color-${album.id})`,
                    } as React.CSSProperties
                  }
                >
                  <h2
                    className="sticky top-0 px-6 flex gap-2 items-center hover:text-[var(--color)] transition-colors cursor-pointer text-gray-900 m-0 text-sm font-display"
                    onClick={() => {
                      const horizontalElementImage = document.getElementById(
                        `horizontal-${album.id}`,
                      );
                      if (horizontalElementImage) {
                        horizontalElementImage.parentElement?.scrollIntoView({
                          block: "center",
                          inline: "center",
                        });
                      }
                      setLayout("horizontal");
                    }}
                  >
                    {album.name}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-4 col-span-3">
                  {album.photos.map((photo) => (
                    <MotionImage
                      id={`vertical-${photo.filename}`}
                      layoutId={photo.filename}
                      width={photo.format === "landscape" ? 1024 : 1024}
                      height={photo.format === "landscape" ? 1536 : 1536}
                      onClick={() => {
                        const horizontalElementImage = document.getElementById(
                          `horizontal-${photo.filename}`,
                        );
                        const contentElementImage =
                          document.getElementById("scroller-content");

                        if (horizontalElementImage && contentElementImage) {
                          horizontalElementImage.parentElement?.scrollIntoView({
                            block: "center",
                            inline: "center",
                          });

                          window.requestAnimationFrame(() => {
                            const { scrollLeft } = contentElementImage;
                            const ratio = scrollLeft / window.innerWidth;
                            const windowHeight = window.innerHeight;
                            const top = windowHeight * ratio;

                            window.scrollTo({ top });
                          });
                        }
                        setLayout("horizontal");
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-72 w-auto cursor-pointer rounded-sm"
                      key={photo.id}
                      src={photo.filename}
                      alt={photo.filename}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
