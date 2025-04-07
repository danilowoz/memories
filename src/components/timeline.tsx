"use client";

import data from "@/data.json";
import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";
import type { Memories, Photo } from "@/utils/types";
import { type AnimationControls, motion, useAnimation } from "motion/react";
import * as React from "react";

const payload = data as Memories;

export const Timeline = ({
  windowLength,
  windowProgress,
  onMove,
}: {
  windowLength: number;
  windowProgress: number;
  onMove: (
    event: React.MouseEvent<HTMLDivElement>,
    behavior?: ScrollBehavior,
  ) => void;
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const [albumSizes, setAlbumSizes] = React.useState<Array<[number, number]>>(
    new Array(payload.length).fill([0, 0]),
  );
  const [windowWidth, setWindowWidth] = React.useState<number>(0);

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  const handleAlbumSizeCalculated = React.useCallback(
    (albumIndex: number, flexRatio: number, albumWidth: number) => {
      setAlbumSizes((prev) => {
        const next = [...prev];
        next[albumIndex] = [flexRatio, albumWidth];
        return next;
      });
    },
    [],
  );

  const albumPositions = React.useMemo(() => {
    let horizontalOffset = 0;
    return albumSizes.map(([_, albumWidth]) => {
      const startOffset = horizontalOffset;
      horizontalOffset += albumWidth;
      return { startOffset, albumWidth };
    });
  }, [albumSizes]);

  return (
    <div
      className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-6 items-center h-[50px]"
      onClick={(event) => onMove(event, "smooth")}
      onMouseDown={() => {
        setIsDragging(true);
        document.body.classList.add("cursor-ew-resize");
        document.body.classList.add("select-none");
      }}
      onMouseUp={() => {
        setIsDragging(false);
        document.body.classList.remove("cursor-ew-resize");
        document.body.classList.remove("select-none");
      }}
      onMouseMove={(event) => {
        if (isDragging) {
          onMove(event);
        }
      }}
    >
      {payload.map((album, index) => (
        <React.Fragment key={album.id}>
          <SizeCalculator
            photos={album.photos}
            windowLength={windowLength}
            onSizeCalculated={(flexRatio, albumWidth) =>
              handleAlbumSizeCalculated(index, flexRatio, albumWidth)
            }
          />

          <TimelineItem
            albumWidth={albumSizes[index][1]}
            flexRatio={albumSizes[index][0]}
            id={album.id}
            isFirst={index === 0}
            isLast={index === payload.length - 1}
            isDragging={isDragging}
            startOffset={albumPositions[index].startOffset}
            windowLength={windowLength}
            windowProgress={windowProgress}
            windowWidth={windowWidth}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

const TimelineItem = ({
  albumWidth,
  flexRatio,
  id,
  isFirst,
  isLast,
  startOffset,
  windowLength,
  windowProgress,
  windowWidth,
  isDragging,
}: {
  albumWidth: number;
  flexRatio: number;
  id: number;
  isFirst: boolean;
  isLast: boolean;
  startOffset: number;
  windowLength: number;
  windowProgress: number;
  windowWidth: number;
  isDragging: boolean;
}) => {
  const paddingX = 24;
  const paddingXPercentage = (paddingX / windowLength) * 100;
  const indicatorWidth = windowWidth / 20;
  const indicatorWidthPercentage = (indicatorWidth / windowLength) * 100;
  const progressOffset = windowProgress - startOffset + windowWidth / 2;
  let progressPercentage = (progressOffset / albumWidth) * 100;

  if (isFirst) {
    progressPercentage = Math.max(0, progressPercentage);
  }

  if (isLast) {
    progressPercentage = Math.min(
      100 - (indicatorWidthPercentage - paddingXPercentage) * 100,
      progressPercentage,
    );
  }

  return (
    <motion.div
      className="h-1.5 rounded-full relative overflow-hidden"
      style={{ flexGrow: flexRatio }}
      whileHover={{
        height: 12,
        transition: {
          type: "spring",
          duration: 0.2,
          bounce: 0.3,
        },
      }}
      animate={{
        height: isDragging ? 12 : undefined,
      }}
    >
      <motion.div className="h-1.5 absolute left-0 right-0 top-[calc(50%-3px)] bg-gray-400/20" />

      <motion.div
        className="absolute h-full rounded-full cursor-ew-resize"
        style={{
          left: `${progressPercentage}%`,
          width: `${indicatorWidth}px`,
          backgroundColor: `var(--color-${id})`,
        }}
      />
    </motion.div>
  );
};

function useCalculateSectionLength(windowLength: number, photos: Photo[]) {
  const [flexRatio, setFlexRatio] = React.useState<number>(0);
  const [albumWidth, setAlbumWidth] = React.useState<number>(0);

  React.useEffect(() => {
    const controller = new AbortController();

    function handleResize() {
      const photoPadding = getPhotoPadding();
      const metadata = {
        albumLength: 1,
        portraitLength: photos.filter((photo) => photo.format === "portrait")
          .length,
        landscapeLength: photos.filter((photo) => photo.format === "landscape")
          .length,
      };

      const [totalWidth, ratio] = calculateScrollViewLength(
        metadata,
        photoPadding,
        windowLength,
      );

      setFlexRatio(ratio);
      setAlbumWidth(totalWidth);
    }

    handleResize();

    window.addEventListener("resize", handleResize, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [windowLength, photos]);

  return [flexRatio, albumWidth] as const;
}

const SizeCalculator = ({
  photos,
  windowLength,
  onSizeCalculated,
}: {
  photos: Photo[];
  windowLength: number;
  onSizeCalculated: (flexRatio: number, albumWidth: number) => void;
}) => {
  const [flexRatio, albumWidth] = useCalculateSectionLength(
    windowLength,
    photos,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: callback prop doesn't need to trigger effect
  React.useEffect(() => {
    onSizeCalculated(flexRatio, albumWidth);
  }, [flexRatio, albumWidth]);

  return null;
};
