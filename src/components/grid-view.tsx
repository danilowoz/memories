"use client";

import { cn } from "@/utils/classname";
import { formatDate } from "@/utils/date";
import type { Memories } from "@/utils/types";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import React from "react";
import { context } from "./context";

export const GridView = ({
  payload,
  children,
}: { payload: Memories; children: React.ReactNode }) => {
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

  React.useEffect(() => {
    const elements = document.querySelectorAll(".md\\:sticky");
    const observers: IntersectionObserver[] = [];
    const visibilityMap = new Map<Element, boolean>();

    const updateFirstVisible = () => {
      for (const el of elements) {
        el.classList.remove("text-neutral-900");
      }

      for (const element of elements) {
        if (visibilityMap.get(element)) {
          element.classList.add("text-neutral-900");
          break;
        }
      }
    };

    for (const element of elements) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const isVisible = entry.isIntersecting;
            visibilityMap.set(entry.target, isVisible);
          }

          updateFirstVisible();
        },
        {
          rootMargin: "-20px 0px -100% 0px",
          threshold: [0],
        },
      );

      observer.observe(element);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }

      visibilityMap.clear();
    };
  }, [payload, layout]);

  return (
    <>
      <AnimatePresence initial={false}>
        {layout === "grid" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

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

      <LayoutGroup>
        <motion.div
          layout
          layoutDependency={[layout]}
          onLayoutMeasure={() => {
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
          {payload.map((album, albumIndex) => {
            const indexClickedId = Math.max(
              album.photos.findIndex((p) => p.filename === clickedId),
              hasInteracted ? 0 : -1,
            );

            return (
              <React.Fragment key={album.id}>
                <div>
                  <AnimatePresence initial={false}>
                    {layout === "grid" && (
                      <h2
                        className={cn(
                          "text-lg font-display text-neutral-400 hover:text-neutral-900",
                          "w-full flex gap-4 items-center md:inline-block md:w-auto p-4 md:p-0",
                          "md:sticky md:top-0 md:aspect-square md:transition-colors md:cursor-pointer md:m-0 md:-rotate-90 md:translate-x-5.5",
                          albumIndex === 0 ? "text-neutral-900" : "",
                        )}
                        onClick={() => {
                          handleImageClick(`horizontal-${albumIndex}`);
                        }}
                        id={`vertical-${album.id}`}
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
                      </h2>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-4 col-span-3">
                  {album.photos.map((photo, index) => {
                    return (
                      <motion.div key={photo.filename} layout="position">
                        {layout === "grid" && (
                          <motion.img
                            layoutDependency={[layout, payload]}
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
                              // duration: 10,
                              duration: hasInteracted ? 0.7 : 0,
                            }}
                            style={{
                              zIndex: indexClickedId === index ? 10 : 1,
                            }}
                            className={cn(
                              "md:h-72 md:w-auto cursor-pointer md:rounded-xs relative pointer-events-none md:pointer-events-auto will-change-transform",
                              {
                                "md:w-[432px]": photo.format === "landscape",
                              },
                            )}
                            src={photo.filename}
                            alt={photo.filename}
                            whileHover={{
                              scale: 1.02,
                              transition: {
                                duration: 0.6,
                                type: "spring",
                                bounce: 0,
                              },
                            }}
                            onAnimationComplete={() => {
                              setHasInteracted(true);
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </motion.div>
      </LayoutGroup>
    </>
  );
};
