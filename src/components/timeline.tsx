"use client";

import data from "@/data.json";
import { cn } from "@/utils/classname";
import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";
import type { Memories, Photo } from "@/utils/types";
import { motion } from "motion/react";
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
      className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-4 items-center h-[50px]"
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
      <div className="flex flex-row gap-6 items-center flex-1 peer">
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
              isDragging={isDragging}
              isDark={album.dark}
              startOffset={albumPositions[index].startOffset}
              windowLength={windowLength}
              windowProgress={windowProgress}
              windowWidth={windowWidth}
            />
          </React.Fragment>
        ))}
      </div>

      <a
        href="https://danilowoz.com"
        className={cn(
          "w-7 h-7 rounded flex order-first",
          "transition-colors text-gray-400/70 hover:bg-gray-700/10 hover:text-gray-800",
          "peer-has-data-dark:hover:bg-gray-200/10 peer-has-data-dark:hover:text-gray-200",
        )}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          className="m-auto"
        >
          <title>Back to danilowoz.com</title>
          <path
            d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </a>
    </div>
  );
};

const TimelineItem = ({
  albumWidth,
  flexRatio,
  id,
  isDark,
  startOffset,
  windowLength,
  windowProgress,
  windowWidth,
  isDragging,
}: {
  albumWidth: number;
  flexRatio: number;
  id: number;
  isDark: boolean;
  startOffset: number;
  windowLength: number;
  windowProgress: number;
  windowWidth: number;
  isDragging: boolean;
}) => {
  const indicatorWidth = windowWidth / 20;
  const progressOffset = windowProgress - startOffset;
  const progressPercentage = (progressOffset / albumWidth) * 100;

  return (
    <motion.div
      data-dark={isDark && progressPercentage > 0 ? true : undefined}
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
