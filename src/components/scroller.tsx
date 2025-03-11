"use client";

import React from "react";
import { cn } from "@/utils/classname";
import { Timeline } from "./timeline";
import type { Memories } from "@/utils/types";
import { calculateScrollView, getPhotoPadding } from "@/utils/scroll";

export const Scroller = ({
  children,
  payload,
}: {
  payload: Memories;
  children: React.ReactNode;
}) => {
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

  const ref = React.useRef<HTMLDivElement>(null);
  const [totalScrollLength, setTotalScrollLength] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    const controller = new AbortController();

    function handleResize() {
      const photoPadding = getPhotoPadding();

      const metadata = {
        albumLength: payload.length,
        portraitLength: mediaMetaData.portrait,
        landscapeLength: mediaMetaData.landscape,
      };

      const { horizontalScrollLength, ratio } = calculateScrollView(
        metadata,
        photoPadding,
      );

      const screenHeight = window.innerHeight;
      const verticalScrollLength = screenHeight * ratio;
      document.body.style.height = `${verticalScrollLength}px`;

      setTotalScrollLength(horizontalScrollLength);
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

          ref.current.scrollLeft = window.scrollY * ratio;
        }
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, [mediaMetaData, payload]);

  return (
    <div
      ref={ref}
      className={cn(
        "h-screen w-screen fixed inset-0",
        "flex flex-row flex-nowrap overflow-hidden",
      )}
    >
      {children}

      <Timeline payload={payload} totalScrollLength={totalScrollLength} />
    </div>
  );
};
