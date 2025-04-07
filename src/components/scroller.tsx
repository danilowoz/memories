"use client";

import data from "@/data.json";
import { cn } from "@/utils/classname";
import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";
import type { Memories } from "@/utils/types";
import React from "react";
import { Timeline } from "./timeline";

const payload = data as Memories;

export const Scroller = ({
  children,
}: {
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
      const smallScreen = window.innerWidth < 768;

      if (smallScreen) {
        return;
      }

      const photoPadding = getPhotoPadding();

      const metadata = {
        albumLength: payload.length,
        portraitLength: mediaMetaData.portrait,
        landscapeLength: mediaMetaData.landscape,
      };

      const [length, ratio] = calculateScrollViewLength(metadata, photoPadding);

      const windowHeight = window.innerHeight;
      const verticalScrollLength = windowHeight * ratio;
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
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const ratio = windowWidth / windowHeight;

          setProgress(window.scrollY * ratio);

          ref.current.scrollTo({
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

  function onMove(
    event: React.MouseEvent<HTMLDivElement>,
    behavior?: ScrollBehavior,
  ) {
    if (!ref.current) {
      return;
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const ratio = windowWidth / windowHeight;
    const indicatorWidth = windowWidth / 20;

    const { clientX } = event;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const progress =
      (clientX - left - indicatorWidth / 4 - windowWidth / 22) / width;

    window.scrollTo({
      top: (length * progress) / ratio,
      behavior,
    });
  }

  return (
    <div
      ref={ref}
      className={cn(
        "h-screen w-screen md:fixed md:inset-0",
        "flex flex-col md:flex-row md:flex-nowrap md:overflow-hidden",
      )}
    >
      {children}

      <Timeline
        windowLength={length}
        windowProgress={progress}
        onMove={onMove}
      />
    </div>
  );
};
