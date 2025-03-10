"use client";

import React from "react";
import type { Memories, Photo } from "@/utils/types";
import { calculateScrollView, getPhotoPadding } from "@/utils/scroll";

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
          photos={item.photos}
          key={item.id}
          totalScrollLength={totalScrollLength}
        />
      ))}
    </div>
  );
};

const TimelineItem = ({
  photos,
  totalScrollLength,
}: { photos: Photo[]; totalScrollLength: number }) => {
  const [size, setSize] = React.useState<number | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    function handleResize() {
      const photoPadding = getPhotoPadding();
      const metadata = {
        albumLength: 1,
        portraitLength: photos.filter((photo) => photo.width < photo.height)
          .length,
        landscapeLength: photos.filter((photo) => photo.width > photo.height)
          .length,
      };

      const { ratio } = calculateScrollView(
        metadata,
        photoPadding,
        totalScrollLength,
      );

      setSize(ratio);
    }

    handleResize();

    window.addEventListener("resize", handleResize, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [totalScrollLength, photos]);

  if (size === null) {
    return null;
  }

  return <div className="bg-red-500 h-2" style={{ flexGrow: size }} />;
};
