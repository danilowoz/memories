"use client";

import { calculateScrollViewLength, getPhotoPadding } from "@/utils/scroll";
import type { Memories, Photo } from "@/utils/types";
import { type AnimationControls, motion, useAnimation } from "motion/react";
import * as React from "react";

export const Timeline = ({
  payload,
  windowLength,
  windowProgress,
  onMove,
}: {
  payload: Memories;
  windowLength: number;
  windowProgress: number;
  onMove: (
    event: React.MouseEvent<HTMLDivElement>,
    behavior?: ScrollBehavior,
  ) => void;
}) => {
  const barAnimation = useAnimation();
  const handlerAnimation = useAnimation();
  const [isMouseOver, setIsMouseOver] = React.useState(false);
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

  const initialState = React.useCallback(() => {
    barAnimation.set({
      opacity: 1,
    });

    handlerAnimation.set({
      filter: "saturate(100%)",
      opacity: 1,
    });
  }, [barAnimation, handlerAnimation]);

  const finalState = React.useCallback(() => {
    barAnimation.start({
      opacity: 0,
      transition: {
        duration: 1,
      },
    });

    handlerAnimation.start({
      filter: "saturate(0%)",
      opacity: 0.5,
      transition: {
        duration: 0.5,
      },
    });
  }, [barAnimation, handlerAnimation]);

  React.useEffect(() => {
    initialState();

    const timer = setTimeout(() => {
      if (isMouseOver) {
        return;
      }

      finalState();
    }, 2_000);

    return () => {
      clearTimeout(timer);
    };
  }, [windowProgress, isMouseOver, finalState, initialState]);

  return (
    <div
      className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-6 items-center h-[60px]"
      onMouseEnter={() => {
        initialState();
        setIsMouseOver(true);
      }}
      onMouseLeave={() => {
        setIsMouseOver(false);
      }}
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
            startOffset={albumPositions[index].startOffset}
            windowLength={windowLength}
            windowProgress={windowProgress}
            windowWidth={windowWidth}
            barAnimation={barAnimation}
            handlerAnimation={handlerAnimation}
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
  barAnimation,
  handlerAnimation,
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
  barAnimation: AnimationControls;
  handlerAnimation: AnimationControls;
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
      className="h-1.5 rounded-full relative overflow-hidden"
      style={{ flexGrow: flexRatio }}
    >
      <motion.div
        animate={barAnimation}
        className="absolute inset-0 bg-gray-400/10"
      />

      <motion.div
        className="absolute h-full rounded-full bg-gray-400/50 cursor-ew-resize"
        animate={handlerAnimation}
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
