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
  const [lengths, setLengths] = React.useState<Array<[number, number]>>(
    new Array(payload.length).fill([0, 0]),
  );

  const handleSizeCalculated = React.useCallback(
    (index: number, ratio: number, totalScrollLength: number) => {
      setLengths((prev) => {
        const next = [...prev];
        next[index] = [ratio, totalScrollLength];
        return next;
      });
    },
    [],
  );

  const positions = React.useMemo(() => {
    let cumulative = 0;
    return lengths.map(([_, totalScrollLength]) => {
      const start = cumulative;
      cumulative += totalScrollLength;
      return { start, length: totalScrollLength };
    });
  }, [lengths]);

  return (
    <div className="fixed left-0 right-0 bottom-0 mx-6 flex flex-row gap-6 items-center h-[60px]">
      {payload.map((item, index) => (
        <React.Fragment key={item.id}>
          <SizeCalculator
            photos={item.photos}
            windowLength={windowLength}
            onSizeCalculated={(ratio, totalScrollLength) =>
              handleSizeCalculated(index, ratio, totalScrollLength)
            }
          />

          <TimelineItem
            length={lengths[index][0]}
            windowProgress={windowProgress}
            startPosition={positions[index].start}
            itemLength={positions[index].length}
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
  onSizeCalculated: (size: number, scrollLength: number) => void;
}) => {
  const [ratio, totalScrollLength] = useCalculateSectionLength(
    windowLength,
    photos,
  );

  React.useEffect(() => {
    onSizeCalculated(ratio, totalScrollLength);
  }, [ratio, totalScrollLength]);

  return null;
};

const TimelineItem = ({
  length,
  windowProgress,
  startPosition,
  itemLength,
}: {
  length: number;
  windowProgress: number;
  startPosition: number;
  itemLength: number;
}) => {
  const itemProgress = windowProgress - startPosition;
  const relativeProgress = Math.max(
    0,
    Math.min(100, (itemProgress / itemLength) * 100),
  );

  return (
    <motion.div
      className="h-2 rounded-full bg-gray-400/10 relative"
      style={{
        flexGrow: length,
      }}
    >
      {/* Progress */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gray-400/50"
        style={{
          right: `${100 - relativeProgress}%`,
        }}
      />
    </motion.div>
  );
};

function useCalculateSectionLength(
  globalScrollLength: number,
  photos: Photo[],
) {
  const [ratio, setRatio] = React.useState<number>(0);
  const [totalScrollLength, setTotalScrollLength] = React.useState<number>(0);

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

      const [totalLength, ratio] = calculateScrollViewLength(
        metadata,
        photoPadding,
        globalScrollLength,
      );

      setRatio(ratio);
      setTotalScrollLength(totalLength);
    }

    handleResize();

    window.addEventListener("resize", handleResize, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [globalScrollLength, photos]);

  return [ratio, totalScrollLength] as const;
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
