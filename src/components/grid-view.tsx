"use client";

import payload from "@/data.json";
import { cn } from "@/utils/classname";
import { AnimatePresence, motion } from "motion/react";
import NextjsImage from "next/image";
import React from "react";
import { context } from "./context";

const MotionImage = motion.create(NextjsImage);

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

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        type="button"
        onClick={() => {
          setLayout("list");
        }}
        className={cn(
          "fixed left-6 bottom-2.5 z-50",
          "w-7 h-7 rounded flex cursor-pointer",
          "transition-colors text-gray-400 hover:bg-gray-700/10 hover:text-gray-800",
          {
            "pointer-events-none": layout === "list",
          },
        )}
      >
        <AnimatePresence initial={false}>
          {layout === "grid" && (
            <motion.svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              className="m-auto"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <title>Grid View</title>
              <path
                d="M11.5 3.04999C11.7485 3.04999 11.95 3.25146 11.95 3.49999V7.49999C11.95 7.74852 11.7485 7.94999 11.5 7.94999C11.2515 7.94999 11.05 7.74852 11.05 7.49999V4.58639L4.58638 11.05H7.49999C7.74852 11.05 7.94999 11.2515 7.94999 11.5C7.94999 11.7485 7.74852 11.95 7.49999 11.95L3.49999 11.95C3.38064 11.95 3.26618 11.9026 3.18179 11.8182C3.0974 11.7338 3.04999 11.6193 3.04999 11.5L3.04999 7.49999C3.04999 7.25146 3.25146 7.04999 3.49999 7.04999C3.74852 7.04999 3.94999 7.25146 3.94999 7.49999L3.94999 10.4136L10.4136 3.94999L7.49999 3.94999C7.25146 3.94999 7.04999 3.74852 7.04999 3.49999C7.04999 3.25146 7.25146 3.04999 7.49999 3.04999L11.5 3.04999Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

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
                className="text-right"
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
                      className="sticky text-right top-0 px-6 flex gap-2 items-center justify-end hover:text-(--color) transition-colors cursor-pointer text-gray-900 m-0 text-md font-display"
                      onClick={() => {
                        handleImageClick(`horizontal-${album.id}`);
                      }}
                      id={`vertical-${album.id}`}
                    >
                      {album.name}
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-4 col-span-3">
                {album.photos.map((photo, index) => {
                  return (
                    <AnimatePresence key={photo.id}>
                      {layout === "grid" && (
                        <MotionImage
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
                            "h-72 w-auto cursor-pointer rounded-xs will-change-transform",
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
  const distance = Math.abs(target - index);
  return distance === 0 ? 0.3 : Math.max(0.1, 0.3 - distance * 0.01);
}
