"use client";

import React from "react";
import type { Memories, Photo } from "@/utils/types";
import { calculateScrollView, getPhotoPadding } from "@/utils/scroll";
import { MAP_COLORS } from "@/utils/colors";
import { motion, useAnimation } from "motion/react";
export const Timeline = ({
  payload,
  totalScrollLength,
}: { payload: Memories; totalScrollLength: number | null }) => {
  if (totalScrollLength === null) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 mx-6 flex flex-row gap-6 mix-blend-multiply items-center h-[60px]">
      {payload.map((item) => (
        <TimelineItem
          photos={item.photos}
          key={item.id}
          totalScrollLength={totalScrollLength}
          id={item.id}
        />
      ))}
    </div>
  );
};

const TimelineItem = ({
  photos,
  totalScrollLength,
  id,
}: { photos: Photo[]; totalScrollLength: number; id: number }) => {
  const [size, setSize] = React.useState<number | null>(null);

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

  const barAnimation = useAnimation();
  const childAnimation = useAnimation();

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

  if (size === null) {
    return null;
  }

  return (
    <motion.div
      className="h-2 rounded-full bg-gray-200 relative"
      style={{
        flexGrow: size,
      }}
      // animate={barAnimation}
      // transition={{
      //   type: "spring",
      //   duration: 0.1,
      //   bounce: 0,
      // }}
      // initial={{
      //   height: 16,
      //   transition: {
      //     type: "spring",
      //     duration: 0.5,
      //     bounce: 0.2,
      //   },
      // }}
      // whileHover={{
      //   height: 32,
      //   transition: {
      //     type: "spring",
      //     duration: 0.6,
      //     bounce: 0.4,
      //   },
      // }}
    >
      <motion.div
        // animate={childAnimation}
        className="absolute inset-0 rounded-full opacity-0"
        style={{
          backgroundColor: MAP_COLORS[id as keyof typeof MAP_COLORS],
        }}
      />
    </motion.div>
  );
};

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}
