"use client";

import React from "react";
import type { Memories, Photo } from "@/utils/types";
import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";
import { motion } from "motion/react";

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
            flexRatio={albumSizes[index][0]}
            windowProgress={windowProgress}
            startOffset={albumPositions[index].startOffset}
            albumWidth={albumPositions[index].albumWidth}
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

  React.useEffect(() => {
    onSizeCalculated(flexRatio, albumWidth);
  }, [flexRatio, albumWidth]);

  return null;
};

const TimelineItem = ({
  flexRatio,
  windowProgress,
  startOffset,
  albumWidth,
}: {
  flexRatio: number;
  windowProgress: number;
  startOffset: number;
  albumWidth: number;
}) => {
  const progressOffset = windowProgress - startOffset + window.innerWidth;
  const progressPercentage = Math.max(
    0,
    Math.min(100, (progressOffset / albumWidth) * 100),
  );

  return (
    <motion.div
      className="h-2 rounded-full bg-gray-400/10 relative overflow-hidden"
      style={{
        flexGrow: flexRatio,
      }}
    >
      {/* Progress */}
      <motion.div
        className="absolute w-full h-full rounded-full bg-gray-400/50"
        style={{
          right: `${100 - progressPercentage}%`,
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
