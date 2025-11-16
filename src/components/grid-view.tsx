"use client";

import payload from "@/data.json";
import { cn } from "@/utils/classname";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { context } from "./context";

export const GridView = () => {
  const { layout, setLayout, clickedId } = React.useContext(context);

  function handleImageClick(id: string) {
    const horizontalElementImage = document.getElementById(id);
    const contentElementImage = document.getElementById("scroller-content");

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

    setLayout("list");
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {layout === "grid" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20"
          />
        )}
      </AnimatePresence>

      <div
        ref={() => {
          // Send message
          const event = new Event("grid-loaded");
          window.dispatchEvent(event);

          // Wait for image click
          const controller = new AbortController();
          const readMessage = (e: Event) => {
            const src = (e as CustomEvent).detail;

            const verticalElementImage = document.getElementById(
              `vertical-${src}`,
            );

            if (verticalElementImage) {
              verticalElementImage?.scrollIntoView({
                block: "center",
                inline: "center",
              });
            }

            controller.abort();
          };

          window.addEventListener("image-clicked", readMessage, {
            signal: controller.signal,
          });
        }}
        className={cn(
          "fixed inset-0 overflow-auto z-20 grid grid-cols-4 gap-24 py-4",
          {
            "pointer-events-none": layout === "list",
          },
        )}
      >
        {payload.map((album) => {
          const indexClickedId = album.photos.findIndex(
            (p) => p.filename === clickedId,
          );

          return (
            <React.Fragment key={album.id}>
              <div
                style={
                  {
                    "--color": `var(--color-${album.id})`,
                  } as React.CSSProperties
                }
              >
                <AnimatePresence>
                  {layout === "grid" && (
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="sticky top-0 pr-6 aspect-square inline-block hover:text-(--color) transition-colors cursor-pointer text-gray-900 m-0 text-lg font-display -rotate-90 translate-x-6"
                      onClick={() => {
                        handleImageClick(`horizontal-${album.id}`);
                      }}
                      id={`vertical-${album.id}`}
                      whileInView={{
                        opacity: 1,
                      }}
                    >
                      {album.name}
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-4 col-span-3">
                {album.photos.map((photo, index) => {
                  return (
                    <AnimatePresence key={photo.id} initial={false}>
                      {layout === "grid" && (
                        <motion.img
                          id={`vertical-${photo.filename}`}
                          layoutId={photo.filename}
                          width={photo.format === "landscape" ? 1024 : 1024}
                          height={photo.format === "landscape" ? 1536 : 1536}
                          onClick={() => {
                            handleImageClick(`horizontal-${photo.filename}`);
                          }}
                          transition={{
                            duration: getDuration(indexClickedId, index),
                          }}
                          style={{
                            zIndex: indexClickedId === index ? 10 : 1,
                          }}
                          className={cn(
                            "h-72 w-auto cursor-pointer rounded-xs relative",
                            {
                              "w-[432px]": photo.format === "landscape",
                            },
                          )}
                          src={photo.filename}
                          alt={photo.filename}
                        />
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

function getDuration(target: number, index: number) {
  if (target === -1) {
    return 0;
  }

  const distance = Math.abs(target - index);
  return distance === 0 ? 0.3 : Math.max(0.1, 0.3 - distance * 0.01);
}
