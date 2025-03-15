"use client";

import React from "react";
import type { Memories, Photo } from "@/utils/types";
import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";
import { motion } from "motion/react";
import { MAP_COLORS } from "@/utils/colors";

export const Timeline = ({
  payload,
  windowLength,
  windowProgress,
}: {
  payload: Memories;
  windowLength: number;
  windowProgress: number;
}) => {
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
    <div className="fixed left-0 right-0 bottom-0 mx-6 flex flex-row gap-6 items-center h-[60px]">
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
}) => {
  const paddingX = 24;
  const paddingXPercentage = (paddingX / windowLength) * 100;
  const indicatorWidth = windowWidth / 20;
  const indicatorWidthPercentage = (indicatorWidth / windowLength) * 100;
  const progressOffset = windowProgress - startOffset;
  let progressPercentage = (progressOffset / albumWidth) * 100;

  // Handle first item starting position
  if (isFirst) {
    progressPercentage = Math.max(0, progressPercentage);
  }

  // Handle last item end position
  if (isLast) {
    progressPercentage = Math.min(
      100 - (indicatorWidthPercentage - paddingXPercentage) * 100,
      progressPercentage,
    );
  }

  return (
    <motion.div
      className="h-1 rounded-full bg-gray-400/10 relative overflow-hidden"
      style={{ flexGrow: flexRatio }}
    >
      <motion.div
        className="absolute h-full rounded-full bg-gray-400/50"
        style={{
          left: `${progressPercentage}%`,
          width: `${indicatorWidth}px`,
          backgroundColor: MAP_COLORS[id as keyof typeof MAP_COLORS],
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

// const barAnimation = useAnimation();
// const childAnimation = useAnimation();

// React.useEffect(() => {
//   const controller = new AbortController();

//   document.addEventListener(
//     "mousemove",
//     (event) => {
//       const topOffset = window.innerHeight * 0.7;
//       const bottomOffset = window.innerHeight * 0.1;
//       const windowHeight = window.innerHeight - topOffset - bottomOffset;

//       if (event.clientY < topOffset) {
//         barAnimation.set({ height: 8 });

//         return;
//       }

//       if (event.clientY > window.innerHeight - bottomOffset) {
//         return;
//       }

//       const mouseY = event.clientY - topOffset;
//       const ratio = mouseY / windowHeight;

//       barAnimation.set({
//         height: lerp(8, 16, ratio),
//       });
//     },
//     { signal: controller.signal },
//   );

//   return () => {
//     controller.abort();
//   };
// }, []);

// React.useEffect(() => {
//   const controller = new AbortController();

//   document.addEventListener(
//     "mousemove",
//     (event) => {
//       const topOffset = window.innerHeight * 0.8;
//       const bottomOffset = window.innerHeight * 0.1;
//       const windowHeight = window.innerHeight - topOffset - bottomOffset;

//       if (event.clientY < topOffset) {
//         childAnimation.set({ opacity: 0 });

//         return;
//       }

//       if (event.clientY > window.innerHeight - bottomOffset) {
//         return;
//       }

//       const mouseY = event.clientY - topOffset;
//       const ratio = mouseY / windowHeight;

//       childAnimation.set({ opacity: lerp(0, 1, ratio) });
//     },
//     {
//       signal: controller.signal,
//     },
//   );

//   return () => {
//     controller.abort();
//   };
// }, []);
