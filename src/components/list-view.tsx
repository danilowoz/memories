"use client";

import { COLORS } from "@/styles/colors";
import { useIsSafari } from "@/utils/browser";
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
import { context } from "./context";

export const ListView = ({
  children,
  payload,
}: {
  children: React.ReactNode;
  payload: Memories;
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const { scrollX, windowWidth, layout } = React.useContext(context);
  const thumbPosition = useMotionValue(0);
  const safari = useIsSafari();

  const springScrollX = useSpring(scrollX as unknown as number, {
    duration: 0.3,
    bounce: 0.1,
  });

  React.useEffect(() => {
    return springScrollX.on("change", (latest) => {
      if (contentRef.current) {
        contentRef.current.scrollLeft = latest;
      }
    });
  }, [springScrollX]);

  const [thumbWidth, setThumbWidth] = React.useState(20);
  const [scrollWidth, setScrollWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startThumbPosition, setStartThumbPosition] = React.useState(0);
  const [albumSizes, setAlbumSizes] = React.useState<Array<[number, number]>>(
    new Array(payload.length).fill([0, 0]),
  );

  React.useEffect(() => {
    setAlbumSizes(new Array(payload.length).fill([0, 0]));
  }, [payload]);

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

    thumbPosition.set(newThumbPosition);
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
    setStartThumbPosition(thumbPosition.get());
    e.preventDefault(); // Prevent text selection during drag

    handlerHeight.set(THUMB_SIZE_STATE.DRAG);

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
  }, [payload]);

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
      thumbPosition.set(newThumbPosition);

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
    [startThumbPosition, startX, thumbWidth, isDragging, thumbPosition],
  );

  React.useEffect(() => {
    getAlbumScrollWidthAndOffset();

    const controller = new AbortController();

    window.addEventListener("resize", getAlbumScrollWidthAndOffset, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [getAlbumScrollWidthAndOffset]);

  React.useEffect(() => {
    const content = contentRef.current;

    if (!content || layout === "grid") {
      return;
    }

    const controller = new AbortController();

    updateThumbSizeAndPosition();
    updateBodyHeight();

    content.addEventListener("scroll", updateThumbSizeAndPosition, {
      signal: controller.signal,
    });

    window.addEventListener("load", updateThumbSizeAndPosition, {
      signal: controller.signal,
    });

    window.addEventListener(
      "wheel",
      (event) => {
        if (!safari) {
          window.scroll(0, window.scrollY + event.deltaX);
        }
      },
      {
        signal: controller.signal,
      },
    );

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

          if (!isHovering) {
            handlerHeight.set(THUMB_SIZE_STATE.IDLE);
          }
        },
        { signal: controller.signal },
      );
    }

    return () => {
      controller.abort();
    };
  }, [
    isDragging,
    isHovering,
    updateThumbSizeAndPosition,
    updateBodyHeight,
    handleOnWindowScroll,
    handleOnDrag,
    safari,
    layout,
  ]);

  const HEIGHT = 50;

  const handlerHeight = useSpring(THUMB_SIZE_STATE.IDLE, {
    bounce: 0.2,
    duration: 300,
  });
  const mx = useSpring(0, { bounce: 0 });
  const my = useSpring(HEIGHT / 2, { bounce: 0 });

  const moveTop = useTransform(my, [0, HEIGHT / 2, HEIGHT], [-1, 0, 1]);
  const moveLeft = useTransform(
    mx,
    [0, windowWidth / 2, windowWidth],
    [-20, 0, 20],
  );

  const isHoveringTimer = React.useRef<NodeJS.Timeout | null>(null);

  return (
    <div
      ref={contentRef}
      id="scroller-content"
      className={cn(
        "h-screen w-screen md:fixed md:inset-0",
        "flex flex-col md:flex-row md:flex-nowrap md:overflow-hidden gap-12 md:gap-0",
        "md:has-data-dark:bg-black transition-colors duration-500",
      )}
    >
      {children}

      <motion.div
        className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-4 items-center h-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: layout === "list" ? 1 : 0 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div
          ref={trackRef}
          className="flex flex-row gap-6 items-center flex-1 peer h-[42px]"
          onMouseDown={handleThumbMouseDown}
          onClick={handleTrackClick}
          onMouseMove={(e) => {
            const { left, top } = e.currentTarget.getBoundingClientRect();

            mx.set(e.clientX - left);
            my.set(e.clientY - top);

            setIsHovering(true);
          }}
          onMouseLeave={() => {
            mx.set(thumbPosition.get());
            my.set(HEIGHT / 2);

            if (!isDragging) {
              handlerHeight.set(THUMB_SIZE_STATE.IDLE);
            }

            if (isHoveringTimer.current) {
              clearTimeout(isHoveringTimer.current);
            }

            isHoveringTimer.current = setTimeout(() => {
              setIsHovering(false);
            }, 300);
          }}
          onMouseEnter={() => {
            if (!isDragging) {
              handlerHeight.set(THUMB_SIZE_STATE.ACTIVE);
            }
          }}
        >
          {payload.map((album, index) => {
            if (!albumSizes[index]?.[0]) {
              return null;
            }

            return (
              <TimelineItem
                key={album.id}
                flexRatio={albumSizes[index][0]}
                thumbWidth={thumbWidth}
                thumbPosition={thumbPosition}
                startOffset={albumSizes[index][1]}
                trackWidth={trackRef.current?.clientWidth || 0}
                scrollWidth={scrollWidth}
                albumIndex={index}
                isDragging={isDragging}
                isHovering={isHovering}
                isDark={album.dark}
                isLast={index === payload.length - 1}
                moveTop={moveTop}
                moveLeft={moveLeft}
                height={handlerHeight}
                onThumbMouseEnter={() => {
                  handlerHeight.set(THUMB_SIZE_STATE.DRAG);
                }}
                onThumbMouseLeave={() => {
                  if (!isDragging) {
                    handlerHeight.set(THUMB_SIZE_STATE.ACTIVE);
                  }
                }}
              />
            );
          })}
        </div>

        <div className={cn("w-7 h-7 order-first pointer-events-none")} />
      </motion.div>
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
  albumIndex,
  isDragging,
  isHovering,
  isDark,
  isLast,
  moveTop,
  moveLeft,
  height,
  onThumbMouseEnter,
  onThumbMouseLeave,
}: {
  flexRatio: number;
  thumbWidth: number;
  thumbPosition: MotionValue<number>;
  startOffset: number;
  trackWidth: number;
  scrollWidth: number;
  albumIndex: number;
  isDragging: boolean;
  isHovering: boolean;
  isDark: boolean;
  isLast: boolean;
  moveTop: MotionValue<number>;
  moveLeft: MotionValue<number>;
  height: MotionValue<number>;
  onThumbMouseEnter: () => void;
  onThumbMouseLeave: () => void;
}) => {
  const { enableDarkMode, setEnableDarkMode, layout } =
    React.useContext(context);
  const relativePosition = useTransform(
    thumbPosition,
    (value) => value - (startOffset / scrollWidth) * trackWidth,
  );

  const xVelocity = useVelocity(thumbPosition);
  const xVelocityScale = useTransform(xVelocity, [-700, 0, 700], [1.4, 1, 1.4]);
  const scaleX = useSpring(xVelocityScale, {
    bounce: 0,
  });

  React.useEffect(() => {
    if (!isHovering) {
      moveLeft.set(0);
      moveTop.set(0);
    }
  }, [isHovering, moveLeft, moveTop]);

  React.useEffect(() => {
    if (isDark && layout === "list") {
      return relativePosition.on("change", (value) => {
        setEnableDarkMode(value > -40);

        if (value > -40) {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
      });
    }
  }, [isDark, relativePosition, setEnableDarkMode, layout]);

  return (
    <>
      {isLast && (
        <meta name="theme-color" content={enableDarkMode ? "#000" : "#fff"} />
      )}
      <motion.div
        data-dark={enableDarkMode ? true : undefined}
        className="h-5 rounded-full relative overflow-hidden"
        style={{ flexGrow: flexRatio, height }}
      >
        <div className="h-0.5 absolute left-0 right-0 top-[calc(50%-1px)] bg-neutral-400/20 rounded-full" />

        <motion.div
          className={cn("absolute h-full rounded-full cursor-ew-resize m-auto")}
          style={{
            height,
            width: `${thumbWidth}px`,
            left: relativePosition,
            backgroundColor: COLORS[albumIndex % COLORS.length],
            y: moveTop,
            x: moveLeft,
            scaleX: isDragging ? undefined : scaleX,
          }}
          onMouseEnter={onThumbMouseEnter}
          onMouseLeave={onThumbMouseLeave}
        />
      </motion.div>
    </>
  );
};

const THUMB_SIZE_STATE = {
  IDLE: 2,
  ACTIVE: 4,
  DRAG: 6,
};
