"use client";

import data from "@/data.json";
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

const payload = data as Memories;

export const Scroller = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const { scrollX, windowWidth, layout, setLayout } = React.useContext(context);
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
    console.log("getAlbumScrollWidthAndOffset");

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
        "bg-white md:has-data-dark:bg-black transition-colors duration-500",
      )}
    >
      {children}

      <motion.div
        className="hidden md:flex fixed left-0 right-0 bottom-0 mx-6 flex-row gap-4 items-center h-[50px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: layout === "list" ? 1 : 0 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <div
          ref={trackRef}
          className="flex flex-row gap-6 items-center flex-1 peer h-[50px]"
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
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setLayout("grid");
          }}
          className={cn(
            "w-7 h-7 rounded flex order-first cursor-pointer",
            "transition-colors text-gray-400 hover:bg-gray-700/10 hover:text-gray-800",
            "peer-has-data-dark:hover:bg-gray-200/10 peer-has-data-dark:hover:text-gray-200",
          )}
        >
          {layout === "list" && (
            <motion.svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              className="m-auto"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <title>Grid View</title>
              <path
                d="M2.8 1L2.74967 0.99997C2.52122 0.999752 2.32429 0.999564 2.14983 1.04145C1.60136 1.17312 1.17312 1.60136 1.04145 2.14983C0.999564 2.32429 0.999752 2.52122 0.99997 2.74967L1 2.8V5.2L0.99997 5.25033C0.999752 5.47878 0.999564 5.67572 1.04145 5.85017C1.17312 6.39864 1.60136 6.82688 2.14983 6.95856C2.32429 7.00044 2.52122 7.00025 2.74967 7.00003L2.8 7H5.2L5.25033 7.00003C5.47878 7.00025 5.67572 7.00044 5.85017 6.95856C6.39864 6.82688 6.82688 6.39864 6.95856 5.85017C7.00044 5.67572 7.00025 5.47878 7.00003 5.25033L7 5.2V2.8L7.00003 2.74967C7.00025 2.52122 7.00044 2.32429 6.95856 2.14983C6.82688 1.60136 6.39864 1.17312 5.85017 1.04145C5.67572 0.999564 5.47878 0.999752 5.25033 0.99997L5.2 1H2.8ZM2.38328 2.01382C2.42632 2.00348 2.49222 2 2.8 2H5.2C5.50779 2 5.57369 2.00348 5.61672 2.01382C5.79955 2.05771 5.94229 2.20045 5.98619 2.38328C5.99652 2.42632 6 2.49222 6 2.8V5.2C6 5.50779 5.99652 5.57369 5.98619 5.61672C5.94229 5.79955 5.79955 5.94229 5.61672 5.98619C5.57369 5.99652 5.50779 6 5.2 6H2.8C2.49222 6 2.42632 5.99652 2.38328 5.98619C2.20045 5.94229 2.05771 5.79955 2.01382 5.61672C2.00348 5.57369 2 5.50779 2 5.2V2.8C2 2.49222 2.00348 2.42632 2.01382 2.38328C2.05771 2.20045 2.20045 2.05771 2.38328 2.01382ZM9.8 1L9.74967 0.99997C9.52122 0.999752 9.32429 0.999564 9.14983 1.04145C8.60136 1.17312 8.17312 1.60136 8.04145 2.14983C7.99956 2.32429 7.99975 2.52122 7.99997 2.74967L8 2.8V5.2L7.99997 5.25033C7.99975 5.47878 7.99956 5.67572 8.04145 5.85017C8.17312 6.39864 8.60136 6.82688 9.14983 6.95856C9.32429 7.00044 9.52122 7.00025 9.74967 7.00003L9.8 7H12.2L12.2503 7.00003C12.4788 7.00025 12.6757 7.00044 12.8502 6.95856C13.3986 6.82688 13.8269 6.39864 13.9586 5.85017C14.0004 5.67572 14.0003 5.47878 14 5.25033L14 5.2V2.8L14 2.74967C14.0003 2.52122 14.0004 2.32429 13.9586 2.14983C13.8269 1.60136 13.3986 1.17312 12.8502 1.04145C12.6757 0.999564 12.4788 0.999752 12.2503 0.99997L12.2 1H9.8ZM9.38328 2.01382C9.42632 2.00348 9.49222 2 9.8 2H12.2C12.5078 2 12.5737 2.00348 12.6167 2.01382C12.7995 2.05771 12.9423 2.20045 12.9862 2.38328C12.9965 2.42632 13 2.49222 13 2.8V5.2C13 5.50779 12.9965 5.57369 12.9862 5.61672C12.9423 5.79955 12.7995 5.94229 12.6167 5.98619C12.5737 5.99652 12.5078 6 12.2 6H9.8C9.49222 6 9.42632 5.99652 9.38328 5.98619C9.20045 5.94229 9.05771 5.79955 9.01382 5.61672C9.00348 5.57369 9 5.50779 9 5.2V2.8C9 2.49222 9.00348 2.42632 9.01382 2.38328C9.05771 2.20045 9.20045 2.05771 9.38328 2.01382ZM2.74967 7.99997L2.8 8H5.2L5.25033 7.99997C5.47878 7.99975 5.67572 7.99956 5.85017 8.04145C6.39864 8.17312 6.82688 8.60136 6.95856 9.14983C7.00044 9.32429 7.00025 9.52122 7.00003 9.74967L7 9.8V12.2L7.00003 12.2503C7.00025 12.4788 7.00044 12.6757 6.95856 12.8502C6.82688 13.3986 6.39864 13.8269 5.85017 13.9586C5.67572 14.0004 5.47878 14.0003 5.25033 14L5.2 14H2.8L2.74967 14C2.52122 14.0003 2.32429 14.0004 2.14983 13.9586C1.60136 13.8269 1.17312 13.3986 1.04145 12.8502C0.999564 12.6757 0.999752 12.4788 0.99997 12.2503L1 12.2V9.8L0.99997 9.74967C0.999752 9.52122 0.999564 9.32429 1.04145 9.14983C1.17312 8.60136 1.60136 8.17312 2.14983 8.04145C2.32429 7.99956 2.52122 7.99975 2.74967 7.99997ZM2.8 9C2.49222 9 2.42632 9.00348 2.38328 9.01382C2.20045 9.05771 2.05771 9.20045 2.01382 9.38328C2.00348 9.42632 2 9.49222 2 9.8V12.2C2 12.5078 2.00348 12.5737 2.01382 12.6167C2.05771 12.7995 2.20045 12.9423 2.38328 12.9862C2.42632 12.9965 2.49222 13 2.8 13H5.2C5.50779 13 5.57369 12.9965 5.61672 12.9862C5.79955 12.9423 5.94229 12.7995 5.98619 12.6167C5.99652 12.5737 6 12.5078 6 12.2V9.8C6 9.49222 5.99652 9.42632 5.98619 9.38328C5.94229 9.20045 5.79955 9.05771 5.61672 9.01382C5.57369 9.00348 5.50779 9 5.2 9H2.8ZM9.8 8L9.74967 7.99997C9.52122 7.99975 9.32429 7.99956 9.14983 8.04145C8.60136 8.17312 8.17312 8.60136 8.04145 9.14983C7.99956 9.32429 7.99975 9.52122 7.99997 9.74967L8 9.8V12.2L7.99997 12.2503C7.99975 12.4788 7.99956 12.6757 8.04145 12.8502C8.17312 13.3986 8.60136 13.8269 9.14983 13.9586C9.32429 14.0004 9.52122 14.0003 9.74967 14L9.8 14H12.2L12.2503 14C12.4788 14.0003 12.6757 14.0004 12.8502 13.9586C13.3986 13.8269 13.8269 13.3986 13.9586 12.8502C14.0004 12.6757 14.0003 12.4788 14 12.2503L14 12.2V9.8L14 9.74967C14.0003 9.52122 14.0004 9.32429 13.9586 9.14983C13.8269 8.60136 13.3986 8.17312 12.8502 8.04145C12.6757 7.99956 12.4788 7.99975 12.2503 7.99997L12.2 8H9.8ZM9.38328 9.01382C9.42632 9.00348 9.49222 9 9.8 9H12.2C12.5078 9 12.5737 9.00348 12.6167 9.01382C12.7995 9.05771 12.9423 9.20045 12.9862 9.38328C12.9965 9.42632 13 9.49222 13 9.8V12.2C13 12.5078 12.9965 12.5737 12.9862 12.6167C12.9423 12.7995 12.7995 12.9423 12.6167 12.9862C12.5737 12.9965 12.5078 13 12.2 13H9.8C9.49222 13 9.42632 12.9965 9.38328 12.9862C9.20045 12.9423 9.05771 12.7995 9.01382 12.6167C9.00348 12.5737 9 12.5078 9 12.2V9.8C9 9.49222 9.00348 9.42632 9.01382 9.38328C9.05771 9.20045 9.20045 9.05771 9.38328 9.01382Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </button>
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
  id,
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
  id: number;
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
  const { enableDarkMode, setEnableDarkMode } = React.useContext(context);
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
    if (isDark) {
      const unsubscribe = relativePosition.on("change", (value) => {
        setEnableDarkMode(value > -40);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isDark, relativePosition]);

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
        <div className="h-0.5 absolute left-0 right-0 top-[calc(50%-1px)] bg-gray-400/20 rounded-full" />

        <motion.div
          className={cn("absolute h-full rounded-full cursor-ew-resize m-auto")}
          style={{
            height,
            width: `${thumbWidth}px`,
            left: relativePosition,
            backgroundColor: `var(--color-${id})`,
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
