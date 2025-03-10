"use client";

import React from "react";
import type { Memories, Memory } from "@/utils/types";
import { LANDSCAPE_RATIO, PORTRAIT_RATIO } from "./constants";
import { PHOTO_SIZE_RATIO } from "./constants";

export const Timeline = ({
  payload,
  totalScrollLength,
}: { payload: Memories; totalScrollLength: number | null }) => {
  if (totalScrollLength === null) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 m-4 flex flex-row gap-4">
      {payload.map((item) => (
        <TimelineItem
          item={item}
          key={item.id}
          totalScrollLength={totalScrollLength}
        />
      ))}
    </div>
  );
};

const TimelineItem = ({
  item,
  totalScrollLength,
}: { item: Memory; totalScrollLength: number }) => {
  const [size, setSize] = React.useState<number | null>(null);

  const portraitLength = item.photos.filter(
    (photo) => photo.width < photo.height,
  ).length;
  const landscapeLength = item.photos.filter(
    (photo) => photo.width > photo.height,
  ).length;

  const albumLength = 1;

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

      const ratio = (horizontalScrollLength / totalScrollLength) * 100;
      setSize(ratio);
    }

    calcScrollView();

    window.addEventListener("resize", calcScrollView, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [item, portraitLength, landscapeLength, totalScrollLength]);

  if (size === null) {
    return null;
  }

  return (
    <div className="bg-red-500 h-2" key={item.id} style={{ flexGrow: size }} />
  );
};
