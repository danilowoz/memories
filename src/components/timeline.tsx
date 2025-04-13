"use client";

import data from "@/data.json";
import { cn } from "@/utils/classname";
import type { Memories, Photo } from "@/utils/types";
import { motion } from "motion/react";
import * as React from "react";

const payload = data as Memories;

export const Timeline = ({
  contentRef,
}: { contentRef: React.RefObject<HTMLElement | null> }) => {
  const [thumbWidth, setThumbWidth] = React.useState(20);
  const [thumbPosition, setThumbPosition] = React.useState(0);
  const [scrollWidth, setScrollWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startThumbPosition, setStartThumbPosition] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const [albumSizes, setAlbumSizes] = React.useState<Array<[number, number]>>(
    new Array(payload.length).fill([0, 0]),
  );

  const updateThumbSizeAndPosition = React.useCallback(() => {
    if (!contentRef.current || !trackRef.current) return;

    const { scrollWidth, clientWidth, scrollLeft } = contentRef.current;
    const trackWidth = trackRef.current.clientWidth;

    const ratio = clientWidth / scrollWidth;
    const calculatedThumbWidth = Math.max(20, Math.floor(trackWidth * ratio));
    setThumbWidth(calculatedThumbWidth);
    setScrollWidth(scrollWidth);

    const maxScrollDistance = scrollWidth - clientWidth;
    const maxThumbPosition = trackWidth - calculatedThumbWidth;
    const newThumbPosition = maxScrollDistance
      ? (scrollLeft / maxScrollDistance) * maxThumbPosition
      : 0;

    setThumbPosition(newThumbPosition);
  }, [contentRef]);

  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const { signal, abort } = new AbortController();

    updateThumbSizeAndPosition();

    let horizontalOffset = 0;
    setAlbumSizes(
      Array.from(content.children).map((item) => {
        const startOffset = horizontalOffset;
        horizontalOffset += item.scrollWidth;
        return [item.scrollWidth / window.innerWidth, startOffset];
      }),
    );

    content.addEventListener("scroll", updateThumbSizeAndPosition, { signal });

    return () => {
      abort();
    };
  }, [contentRef, updateThumbSizeAndPosition]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !contentRef.current) {
      return;
    }

    const trackRect = trackRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - trackRect.left;
    const trackWidth = trackRef.current.clientWidth;
    const thumbHalfWidth = thumbWidth / 2;

    // Calculate new thumb position centered on click
    let newThumbPosition = clickPosition - thumbHalfWidth;

    // Constrain thumb position within track
    newThumbPosition = Math.max(
      0,
      Math.min(newThumbPosition, trackWidth - thumbWidth),
    );

    // Update content scroll position
    const { scrollWidth, clientWidth } = contentRef.current;
    const scrollRatio = newThumbPosition / (trackWidth - thumbWidth);
    const newScrollLeft = scrollRatio * (scrollWidth - clientWidth);

    contentRef.current.scroll({ left: newScrollLeft, behavior: "smooth" });
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartThumbPosition(thumbPosition);
    e.preventDefault(); // Prevent text selection during drag
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current || !contentRef.current) return;

      const deltaX = e.clientX - startX;
      const trackWidth = trackRef.current.clientWidth;

      // Calculate new thumb position
      let newThumbPosition = startThumbPosition + deltaX;

      // Constrain thumb position within track
      newThumbPosition = Math.max(
        0,
        Math.min(newThumbPosition, trackWidth - thumbWidth),
      );
      setThumbPosition(newThumbPosition);

      // Update content scroll position
      const { scrollWidth, clientWidth } = contentRef.current;
      const scrollRatio = newThumbPosition / (trackWidth - thumbWidth);
      const newScrollLeft = scrollRatio * (scrollWidth - clientWidth);

      contentRef.current.scrollLeft = newScrollLeft;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, startThumbPosition, thumbWidth, contentRef]);

  return (
    <div className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-4 items-center h-[50px]">
      <div
        ref={trackRef}
        className="flex flex-row gap-6 items-center flex-1 peer"
        onMouseDown={handleThumbMouseDown}
        onClick={handleTrackClick}
      >
        {payload.map((album, index) => (
          <TimelineItem
            key={album.id}
            flexRatio={albumSizes[index][0]}
            isDragging={isDragging}
            thumbWidth={thumbWidth}
            thumbPosition={thumbPosition}
            startOffset={albumSizes[index][1]}
            trackWidth={trackRef.current?.clientWidth || 0}
            scrollWidth={scrollWidth}
            id={album.id}
            isDark={album.dark}
          />
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
  flexRatio,
  isDragging,
  thumbWidth,
  thumbPosition,
  startOffset,
  trackWidth,
  scrollWidth,
  id,
  isDark,
}: {
  flexRatio: number;
  isDragging: boolean;
  thumbWidth: number;
  thumbPosition: number;
  startOffset: number;
  trackWidth: number;
  scrollWidth: number;
  id: number;
  isDark: boolean;
}) => {
  const relativePosition =
    thumbPosition - (startOffset / scrollWidth) * trackWidth;

  return (
    <motion.div
      data-dark={isDark && relativePosition > 0 ? true : undefined}
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
          width: `${thumbWidth}px`,
          left: `${relativePosition}px`,
          backgroundColor: `var(--color-${id})`,
        }}
      />
    </motion.div>
  );
};
