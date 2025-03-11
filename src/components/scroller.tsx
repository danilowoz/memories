"use client";

import React from "react";
import { cn } from "@/utils/classname";
import { Timeline } from "./timeline";
import type { Memories } from "@/utils/types";
import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";

export const Scroller = ({
  children,
  payload,
}: {
  payload: Memories;
  children: React.ReactNode;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [length, setLength] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

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
      const photoPadding = getPhotoPadding();

      const metadata = {
        albumLength: payload.length,
        portraitLength: mediaMetaData.portrait,
        landscapeLength: mediaMetaData.landscape,
      };

      const [length, ratio] = calculateScrollViewLength(metadata, photoPadding);

      const screenHeight = window.innerHeight;
      const verticalScrollLength = screenHeight * ratio;
      document.body.style.height = `${verticalScrollLength}px`;

      setLength(length);
    }

    handleResize();

    window.addEventListener("resize", handleResize, {
      signal: controller.signal,
    });

    window.addEventListener(
      "scroll",
      (event) => {
        if (ref.current) {
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          const ratio = screenWidth / screenHeight;

          setProgress(window.scrollY * ratio);

          ref.current.scrollLeft = window.scrollY * ratio;
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
      ref={ref}
      className={cn(
        "h-screen w-screen fixed inset-0",
        "flex flex-row flex-nowrap overflow-hidden",
      )}
    >
      {children}

      <Timeline
        payload={payload}
        windowLength={length}
        windowProgress={progress}
      />
    </div>
  );
};
