"use client";

import data from "@/data.json";
import { cn } from "@/utils/classname";
import type { Memories } from "@/utils/types";
import React from "react";
import { Timeline } from "./timeline";

const payload = data as Memories;

export const Scroller = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const mediaMetaData = payload
      .flatMap((item) => item.photos)
      .reduce(
        (acc, item) => {
          if (item.format === "landscape") {
            acc.landscape += 1;
          } else {
            acc.portrait += 1;
          }
          return acc;
        },
        { portrait: 0, landscape: 0 },
      );

    function handleResize() {
      const smallScreen = window.innerWidth < 768;

      if (smallScreen || contentRef.current === null) {
        return;
      }

      const ratio = contentRef.current.scrollWidth / window.innerWidth;
      const windowHeight = window.innerHeight;
      const verticalScrollLength = windowHeight * ratio;

      document.body.style.height = `${verticalScrollLength}px`;
    }

    handleResize();

    window.addEventListener("resize", handleResize, {
      signal: controller.signal,
    });

    window.addEventListener(
      "scroll",
      (event) => {
        if (contentRef.current) {
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const ratio = windowWidth / windowHeight;

          contentRef.current.scrollTo({
            left: window.scrollY * ratio,
          });
        }
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, [payload]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "h-screen w-screen md:fixed md:inset-0",
        "flex flex-col md:flex-row md:flex-nowrap md:overflow-hidden",
      )}
    >
      {children}

      <Timeline contentRef={contentRef} />
    </div>
  );
};
