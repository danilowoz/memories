"use client";

import { accentColor } from "@/lib/data";
import type { Engine } from "@/lib/engine";
import React from "react";

const MIN_THUMB_WIDTH = 20;
const HEIGHT = { idle: 2, hover: 4, grab: 6 };
const MAGNET = { x: 20, y: 1 };
const STRETCH = { max: 0.4, atVelocity: 700 };
const FOLLOW_RATE = 12;

export const Scrubber = ({ engine }: { engine: Engine }) => {
  const barRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const { albums, layout } = engine;

  // biome-ignore lint/correctness/useExhaustiveDependencies: segments re-render when albums or layout change
  React.useEffect(() => {
    const bar = barRef.current;
    const track = trackRef.current;
    if (!bar || !track) return;

    const segments = Array.from(track.children) as HTMLElement[];
    const thumbs = segments.map(
      (segment) => segment.lastElementChild as HTMLElement,
    );
    let trackRect = track.getBoundingClientRect();
    let segmentOffsets = segments.map((segment) => segment.offsetLeft);
    const pointer = { x: 0, y: 0, inside: false };
    const offset = { x: 0, y: 0 };
    let drag: { startX: number; startPosition: number } | null = null;
    let lastPosition = 0;
    let stretch = 0;

    const measure = () => {
      trackRect = track.getBoundingClientRect();
      segmentOffsets = segments.map((segment) => segment.offsetLeft);
    };
    measure();

    const thumbWidth = () =>
      Math.max(
        MIN_THUMB_WIDTH,
        Math.floor((trackRect.width * engine.W) / engine.layout.list.width),
      );
    const travel = () => trackRect.width - thumbWidth();
    const thumbPosition = () =>
      (engine.listX / (engine.maxScroll("list") || 1)) * travel();
    const scrollToThumbPosition = (position: number, instant: boolean) => {
      const clamped = Math.min(Math.max(position, 0), travel());
      engine.scrollTo(
        (clamped / (travel() || 1)) * engine.maxScroll("list"),
        instant,
      );
    };
    const setHeight = (height: number) =>
      track.style.setProperty("--thumb-height", `${height}px`);
    const isOverThumb = (clientX: number) => {
      const x = clientX - trackRect.left - thumbPosition();
      return x >= 0 && x <= thumbWidth();
    };

    const controller = new AbortController();
    const { signal } = controller;

    track.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        track.setPointerCapture(event.pointerId);
        let startPosition = thumbPosition();
        if (!isOverThumb(event.clientX)) {
          startPosition = event.clientX - trackRect.left - thumbWidth() / 2;
          scrollToThumbPosition(startPosition, false);
        }
        drag = { startX: event.clientX, startPosition };
        setHeight(HEIGHT.grab);
        document.body.classList.add("cursor-ew-resize");
      },
      { signal },
    );

    track.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = event.clientX - trackRect.left;
        pointer.y = event.clientY - trackRect.top;
        pointer.inside = true;
        if (drag) {
          const delta = event.clientX - drag.startX;
          if (delta !== 0)
            scrollToThumbPosition(drag.startPosition + delta, true);
        } else {
          setHeight(isOverThumb(event.clientX) ? HEIGHT.grab : HEIGHT.hover);
        }
        engine.invalidate();
      },
      { signal },
    );

    const endDrag = () => {
      drag = null;
      document.body.classList.remove("cursor-ew-resize");
      setHeight(pointer.inside ? HEIGHT.hover : HEIGHT.idle);
    };
    track.addEventListener("pointerup", endDrag, { signal });
    track.addEventListener("pointercancel", endDrag, { signal });
    track.addEventListener(
      "pointerleave",
      () => {
        pointer.inside = false;
        if (!drag) setHeight(HEIGHT.idle);
        engine.invalidate();
      },
      { signal },
    );
    window.addEventListener("resize", measure, { signal });

    const stopFrames = engine.onFrame((_, dt) => {
      bar.style.opacity = String(engine.morph.x);
      const width = thumbWidth();
      const position = thumbPosition();

      const follow = 1 - Math.exp(-dt * FOLLOW_RATE);
      const magnetX = pointer.inside
        ? (pointer.x / trackRect.width - 0.5) * 2 * MAGNET.x
        : 0;
      const magnetY = pointer.inside
        ? (pointer.y / trackRect.height - 0.5) * 2 * MAGNET.y
        : 0;
      offset.x += (magnetX - offset.x) * follow;
      offset.y += (magnetY - offset.y) * follow;

      const velocity = dt > 0 ? Math.abs(position - lastPosition) / dt : 0;
      lastPosition = position;
      const stretchTarget = drag
        ? 0
        : Math.min(velocity / STRETCH.atVelocity, 1) * STRETCH.max;
      stretch += (stretchTarget - stretch) * follow;

      const settling =
        Math.abs(magnetX - offset.x) > 0.05 ||
        Math.abs(magnetY - offset.y) > 0.05 ||
        Math.abs(stretchTarget - stretch) > 0.005;
      if (settling) engine.invalidate();

      thumbs.forEach((thumb, index) => {
        thumb.style.width = `${width}px`;
        thumb.style.transform = `translate3d(${position - segmentOffsets[index] + offset.x}px, ${offset.y}px, 0) scaleX(${1 + stretch})`;
      });
    });

    return () => {
      controller.abort();
      stopFrames();
      document.body.classList.remove("cursor-ew-resize");
    };
  }, [engine, albums, layout]);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      inert={engine.view !== "list"}
      className="fixed left-0 right-0 bottom-0 mx-6 flex flex-row gap-4 items-center h-16 z-30 opacity-0"
    >
      <div className="w-7 h-7 pointer-events-none" />
      <div
        ref={trackRef}
        className="scrubber-track relative flex flex-row gap-6 items-center flex-1 h-[42px] cursor-ew-resize touch-none"
      >
        {albums.map((album, index) => (
          <div
            key={album.id}
            className="scrubber-segment rounded-full relative overflow-hidden"
            style={{ flexGrow: layout.list.albums[index].width / layout.W }}
          >
            <div className="h-0.5 absolute left-0 right-0 top-[calc(50%-1px)] bg-neutral-400/20 rounded-full" />
            <div
              className="absolute left-0 top-0 h-full rounded-full will-change-transform"
              style={{ backgroundColor: accentColor(index) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
