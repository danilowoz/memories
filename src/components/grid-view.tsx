"use client";

import payload from "@/data.json";
import { cn } from "@/utils/classname";
import { formatDate } from "@/utils/date";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { context } from "./context";

export const GridView = () => {
  const { layout, setLayout, clickedId } = React.useContext(context);
  const [hasInteracted, setHasInteracted] = React.useState(false);

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
          "fixed inset-0 overflow-auto z-20 md:grid md:grid-cols-4 md:gap-24 md:py-4",
          {
            "pointer-events-none": layout === "list",
          },
        )}
      >
        {payload.map((album) => {
          const indexClickedId = Math.max(
            album.photos.findIndex((p) => p.filename === clickedId),
            hasInteracted ? 0 : -1,
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
                      className={cn(
                        "text-lg font-display text-gray-900",
                        "w-full flex gap-4 items-center md:inline-block md:w-auto p-4 md:p-0",
                        "md:sticky md:top-0 md:pr-6 md:aspect-square md:hover:text-(--color) md:transition-colors md:cursor-pointer md:m-0 md:-rotate-90 md:translate-x-5.5",
                      )}
                      onClick={() => {
                        handleImageClick(`horizontal-${album.id}`);
                      }}
                      id={`vertical-${album.id}`}
                      whileInView={{
                        opacity: 1,
                      }}
                    >
                      <svg
                        width="371"
                        height="371"
                        viewBox="0 0 371 371"
                        fill="none"
                        className="inset-0 w-5 h-5 md:hidden"
                      >
                        <title>Logo</title>
                        <path
                          d="M10 259H42V326H109V358H10V259ZM363 358H264V326H331V259H363V358ZM109 5V37H42V104H10V5H109ZM363 104H331V37H264V5H363V104Z"
                          fill="currentColor"
                        />
                      </svg>

                      {album.name}
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-4 col-span-3">
                {album.photos.map((photo, index) => {
                  return (
                    <React.Fragment key={photo.id}>
                      <AnimatePresence initial={false} key={photo.id}>
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
                              type: "spring",
                              bounce: 0,
                              duration: hasInteracted ? 0.4 : 0,
                            }}
                            style={{
                              zIndex: indexClickedId === index ? 10 : 1,
                            }}
                            className={cn(
                              "md:h-72 md:w-auto cursor-pointer md:rounded-xs relative pointer-events-none md:pointer-events-auto",
                              {
                                "md:w-[432px]": photo.format === "landscape",
                              },
                            )}
                            src={photo.filename}
                            alt={photo.filename}
                            whileHover={{
                              scale: 1.03,
                              transition: { duration: 0.2 },
                            }}
                            onAnimationComplete={() => {
                              setHasInteracted(true);
                            }}
                          />
                        )}
                      </AnimatePresence>

                      {"location" in photo && photo.date && (
                        <figcaption className="md:hidden p-4 pb-12 flex gap-2">
                          <p className="text-gray-900 m-0 text-sm font-display">
                            {photo.location}
                          </p>
                          <p className="text-gray-900/50 m-0 text-sm">
                            {formatDate(photo.date)}
                          </p>
                        </figcaption>
                      )}
                    </React.Fragment>
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
  return distance === 0 ? 0.6 : Math.max(0, 0.6 - distance * 0.03);
}
