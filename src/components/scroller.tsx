"use client";

import React from "react";
import { cn } from "@/utils/classname";
import { Timeline } from "./timeline";
import type { Memories } from "@/utils/types";
import { PHOTO_SIZE_RATIO } from "./constants";
import { LANDSCAPE_RATIO, PORTRAIT_RATIO } from "./constants";

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
        if (item.width > item.height) {
          acc.landscape += 1;
        } else {
          acc.portrait += 1;
        }
        return acc;
      },
      { portrait: 0, landscape: 0 },
    );

  const albumLength = payload.length;
  const portraitLength = mediaMetaData.portrait;
  const landscapeLength = mediaMetaData.landscape;

  const ref = React.useRef<HTMLDivElement>(null);
  const [totalScrollLength, setTotalScrollLength] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const imageWrapper = document.querySelector(".image-wrapper");
    if (!imageWrapper) {
      throw new Error("`.image-wrapper` not found");
    }

    const photoPadding = Number(
      window
        .getComputedStyle(imageWrapper)
        .getPropertyValue("padding-left")
        .replace("px", ""),
    );

    function calcScrollView() {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const heightWithRatio =
        (screenHeight + photoPadding * 2) * PHOTO_SIZE_RATIO;

      let horizontalScrollLength = 0;

      // cover
      horizontalScrollLength += albumLength * screenWidth;

      // portrait
      horizontalScrollLength +=
        portraitLength * (heightWithRatio * PORTRAIT_RATIO);

      // landscape
      horizontalScrollLength +=
        landscapeLength * (heightWithRatio * LANDSCAPE_RATIO);

      // extra padding, but I don't know why
      horizontalScrollLength += photoPadding;

      const ratio = horizontalScrollLength / screenWidth;
      const verticalScrollLength = screenHeight * ratio;

      document.body.style.height = `${verticalScrollLength}px`;

      setTotalScrollLength(horizontalScrollLength);
    }

    calcScrollView();

    window.addEventListener("resize", calcScrollView, {
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
  }, [albumLength, landscapeLength, portraitLength]);

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
