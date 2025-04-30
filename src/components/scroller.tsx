"use client";

import data from "@/data.json";
import { cn } from "@/utils/classname";
import type { Memories } from "@/utils/types";
import {
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import * as React from "react";

const payload = data as Memories;

export const Scroller = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const scrollX = useMotionValue(0);

  const springScrollX = useSpring(scrollX as unknown as number, {
    duration: 0.3,
    bounce: 0.1,
  });

  React.useEffect(() => {
    return springScrollX.onChange((latest) => {
      if (contentRef.current) {
        contentRef.current.scrollLeft = latest;
      }
    });
  }, [springScrollX]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    let lastValue = 0;

    return springScrollX.onChange((latest) => {
      const childrenWidth = Array.from(contentRef.current?.children ?? [])
        .map((child) => child.clientWidth)
        .map((item, index, arr) => item + (arr[index - 1] || 0));
      childrenWidth.pop();

      if (contentRef.current) {
        clearTimeout(timer);

        const currentSection = childrenWidth.findIndex((width, index) => {
          const start =
            index === 0
              ? 0
              : childrenWidth.slice(0, index).reduce((a, b) => a + b, 0);
          const end = width;

          return (
            latest >= start - window.innerWidth / 1.5 && latest <= start + end
          );
        });

        if (
          latest > lastValue &&
          latest >= childrenWidth[currentSection] - window.innerWidth / 1.5 &&
          latest <= childrenWidth[currentSection]
        ) {
          timer = setTimeout(() => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const ratio = windowWidth / windowHeight;
            const newScrollTop = childrenWidth[currentSection] / ratio;

            window.scrollTo({ top: newScrollTop, behavior: "smooth" });
          }, 200);
        }

        lastValue = latest;
      }
    });
  }, [springScrollX]);

  const [thumbWidth, setThumbWidth] = React.useState(20);
  const [thumbPosition, setThumbPosition] = React.useState(0);
  const [stableWindowWidth, setStableWindowWidth] = React.useState(0);

  const [scrollWidth, setScrollWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startThumbPosition, setStartThumbPosition] = React.useState(0);
  const [albumSizes, setAlbumSizes] = React.useState<Array<[number, number]>>(
    new Array(payload.length).fill([0, 0]),
  );

  const updateThumbSizeAndPosition = React.useCallback(() => {
    if (!contentRef.current || !trackRef.current) {
      return;
    }

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
  }, []);

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !contentRef.current) {
      return;
    }

    const trackRect = trackRef.current.getBoundingClientRect();
    const clickPosition = event.clientX - trackRect.left;
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

    // Calculate the window scroll position based on the width ratio
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const ratio = windowWidth / windowHeight;
    const newScrollTop = newScrollLeft / ratio;

    window.scrollTo({ top: newScrollTop, behavior: "smooth" });
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartThumbPosition(thumbPosition);
    e.preventDefault(); // Prevent text selection during drag

    document.body.classList.add("cursor-ew-resize");
  };

  const getAlbumScrollWidthAndOffset = React.useCallback(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    let horizontalOffset = 0;
    setAlbumSizes(
      Array.from(content.children).map((item) => {
        const startOffset = horizontalOffset;
        horizontalOffset += item.scrollWidth;
        return [item.scrollWidth / window.innerWidth, startOffset];
      }),
    );
  }, []);

  const updateBodyHeight = React.useCallback(() => {
    const smallScreen = window.innerWidth < 768;

    if (smallScreen || contentRef.current === null) {
      return;
    }

    const ratio = contentRef.current.scrollWidth / window.innerWidth;
    const windowHeight = window.innerHeight;
    const verticalScrollLength = windowHeight * ratio;

    document.body.style.height = `${verticalScrollLength}px`;
  }, []);

  const handleOnWindowScroll = React.useCallback(() => {
    if (contentRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const ratio = windowWidth / windowHeight;

      scrollX.set(window.scrollY * ratio);
    }
  }, [scrollX]);

  const handleOnDrag = React.useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !trackRef.current || !contentRef.current) {
        return;
      }

      const deltaX = event.clientX - startX;
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

      // Calculate the window scroll position based on the width ratio
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const ratio = windowWidth / windowHeight;
      const newScrollTop = newScrollLeft / ratio;

      window.scrollTo({ top: newScrollTop });
    },
    [startThumbPosition, startX, thumbWidth, isDragging],
  );

  React.useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    setStableWindowWidth(window.innerWidth);

    const controller = new AbortController();

    getAlbumScrollWidthAndOffset();
    updateThumbSizeAndPosition();
    updateBodyHeight();

    content.addEventListener("scroll", updateThumbSizeAndPosition, {
      signal: controller.signal,
    });

    window.addEventListener("resize", updateBodyHeight, {
      signal: controller.signal,
    });

    window.addEventListener("scroll", handleOnWindowScroll, {
      signal: controller.signal,
    });

    if (isDragging) {
      window.addEventListener("mousemove", (event) => handleOnDrag(event), {
        signal: controller.signal,
      });

      window.addEventListener(
        "mouseup",
        () => {
          setIsDragging(false);
          document.body.classList.remove("cursor-ew-resize");
          handlerHeight.set(6);
        },
        { signal: controller.signal },
      );
    }

    return () => {
      controller.abort();
    };
  }, [
    isDragging,
    updateThumbSizeAndPosition,
    getAlbumScrollWidthAndOffset,
    updateBodyHeight,
    handleOnWindowScroll,
    handleOnDrag,
  ]);

  const HEIGHT = 50;

  const handlerHeight = useSpring(6, {
    bounce: 0.2,
    duration: 500,
  });
  const mx = useSpring(stableWindowWidth / 2);
  const my = useSpring(HEIGHT / 2);

  const moveTop = useTransform(my, [0, HEIGHT / 2, HEIGHT], [-1, 0, 1]);
  const moveLeft = useTransform(
    mx,
    [0, stableWindowWidth / 2, stableWindowWidth],
    [-4, 0, 4],
  );

  return (
    <div
      ref={contentRef}
      className={cn(
        "h-screen w-screen md:fixed md:inset-0",
        "flex flex-col md:flex-row md:flex-nowrap md:overflow-hidden gap-12 md:gap-0",
        "bg-white md:has-data-dark:bg-black transition-colors duration-500",
      )}
    >
      {children}

      <div className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-4 items-center h-[50px]">
        <div
          ref={trackRef}
          className="flex flex-row gap-6 items-center flex-1 peer h-[50px]"
          onMouseDown={handleThumbMouseDown}
          onClick={handleTrackClick}
          onMouseMove={(e) => {
            const { left, top } = e.currentTarget.getBoundingClientRect();

            mx.set(e.clientX - left);
            my.set(e.clientY - top);
          }}
          onMouseLeave={() => {
            mx.set(stableWindowWidth / 2);
            my.set(HEIGHT / 2);

            if (!isDragging) {
              handlerHeight.set(6);
            }
          }}
          onMouseEnter={() => {
            handlerHeight.set(12);
          }}
        >
          {payload.map((album, index) => (
            <TimelineItem
              key={album.id}
              flexRatio={albumSizes[index][0]}
              thumbWidth={thumbWidth}
              thumbPosition={thumbPosition}
              startOffset={albumSizes[index][1]}
              trackWidth={trackRef.current?.clientWidth || 0}
              scrollWidth={scrollWidth}
              id={album.id}
              isDragging={isDragging}
              isDark={album.dark}
              isLast={index === payload.length - 1}
              moveTop={moveTop}
              moveLeft={moveLeft}
              height={handlerHeight}
            />
          ))}
        </div>

        <a
          href="https://danilowoz.com"
          className={cn(
            "w-7 h-7 rounded flex order-first",
            "transition-colors text-gray-500 hover:bg-gray-700/10 hover:text-gray-800",
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
    </div>
  );
};

const TimelineItem = ({
  flexRatio,
  thumbWidth,
  thumbPosition,
  startOffset,
  trackWidth,
  scrollWidth,
  id,
  isDragging,
  isDark,
  isLast,
  moveTop,
  moveLeft,
  height,
}: {
  flexRatio: number;
  thumbWidth: number;
  thumbPosition: number;
  startOffset: number;
  trackWidth: number;
  scrollWidth: number;
  id: number;
  isDragging: boolean;
  isDark: boolean;
  isLast: boolean;
  moveTop: MotionValue<number>;
  moveLeft: MotionValue<number>;
  height: MotionValue<number>;
}) => {
  const relativePosition =
    thumbPosition - (startOffset / scrollWidth) * trackWidth;
  const relativePositionAnimated = useMotionValue(0);
  const darkModeEnabled = isDark && relativePosition > -40;

  React.useEffect(() => {
    relativePositionAnimated.set(relativePosition);
  }, [relativePosition, relativePositionAnimated]);

  const xVelocity = useVelocity(relativePositionAnimated);
  const scaleX = useTransform(xVelocity, [-700, 0, 700], [1.4, 1, 1.4], {
    clamp: false,
  });

  return (
    <>
      {isLast && (
        <meta name="theme-color" content={darkModeEnabled ? "#000" : "#fff"} />
      )}
      <motion.div
        data-dark={darkModeEnabled ? true : undefined}
        className="h-[12px] rounded-full relative overflow-hidden"
        style={{ flexGrow: flexRatio, height }}
      >
        <div className="h-1.5 absolute left-0 right-0 top-[calc(50%-3px)] bg-gray-400/20 rounded-full" />

        <motion.div
          className="absolute h-full rounded-full cursor-ew-resize m-auto"
          style={{
            height,
            width: `${thumbWidth}px`,
            left: relativePositionAnimated,
            backgroundColor: `var(--color-${id})`,
            y: moveTop,
            x: moveLeft,
            scaleX: isDragging ? undefined : scaleX,
          }}
        />
      </motion.div>
    </>
  );
};
