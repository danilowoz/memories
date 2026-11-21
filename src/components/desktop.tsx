"use client";

import { cn } from "@/lib/classname";
import {
  type Album,
  type Grouping,
  accentColor,
  coverPhotoOf,
  formatDate,
  fullSrc,
  thumbSrc,
} from "@/lib/data";
import { Engine } from "@/lib/engine";
import { GRID, LIST } from "@/lib/layout";
import React from "react";
import { GroupingMenu, Toggle } from "./controls";
import { CoverTitle } from "./cover-title";
import { Scrubber } from "./scrubber";

const ACTIVE_LABEL_OFFSET = 20;

const boxStyle = (rect: { x: number; y: number; w: number; h: number }) => ({
  left: rect.x,
  top: rect.y,
  width: rect.w,
  height: rect.h,
});

function setFlag(element: HTMLElement, name: string, on: boolean) {
  if (element.hasAttribute(name) !== on) element.toggleAttribute(name, on);
}

export const Desktop = ({
  albums: requestedAlbums,
  grouping,
  onGroupingChange,
}: {
  albums: Album[];
  grouping: Grouping;
  onGroupingChange: (grouping: Grouping) => void;
}) => {
  const [engine] = React.useState(() => new Engine(requestedAlbums));
  const [useCanvas, setUseCanvas] = React.useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const listLayerRef = React.useRef<HTMLDivElement>(null);
  const gridLayerRef = React.useRef<HTMLDivElement>(null);
  const titlesRef = React.useRef<HTMLDivElement>(null);
  const { albums, layout, view, dark } = engine;

  React.useEffect(() => {
    engine.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const stopListening = engine.onStateChange(rerender);
    engine.start();

    const VERTICAL_STEPS: Record<string, 1 | -1> = {
      ArrowDown: 1,
      ArrowUp: -1,
    };
    const HORIZONTAL_STEPS: Record<string, 1 | -1> = {
      ArrowRight: 1,
      ArrowLeft: -1,
    };
    const handleKeys = (event: KeyboardEvent) => {
      if (event.metaKey || event.altKey || event.ctrlKey) return;
      const inList = engine.view === "list";
      const step =
        VERTICAL_STEPS[event.code] ??
        (inList ? HORIZONTAL_STEPS[event.code] : undefined);
      if (event.code === "Escape" && inList) {
        engine.toggleView();
      } else if (step) {
        event.preventDefault();
        engine.stepToNextSnap(step);
      }
    };
    window.addEventListener("keydown", handleKeys);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      stopListening();
      engine.stop();
    };
  }, [engine]);

  React.useEffect(() => {
    engine.setAlbums(requestedAlbums);
  }, [engine, requestedAlbums]);

  React.useEffect(() => {
    document.body.classList.toggle("dark", dark);
    return () => document.body.classList.remove("dark");
  }, [dark]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!useCanvas || !canvas) return;

    let disposed = false;
    let cleanup = () => {};

    import("@/lib/photo-renderer")
      .then(({ PhotoRenderer }) => {
        if (disposed) return;
        const renderer = new PhotoRenderer(canvas, engine);
        const stopFrames = engine.onFrame(renderer.render);
        cleanup = () => {
          stopFrames();
          renderer.dispose();
        };
      })
      .catch(() => setUseCanvas(false));

    return () => {
      disposed = true;
      cleanup();
    };
  }, [engine, useCanvas]);

  React.useEffect(() => {
    const listLayer = listLayerRef.current;
    const gridLayer = gridLayerRef.current;
    const titleLayer = titlesRef.current;
    if (!listLayer || !gridLayer || !titleLayer) return;

    const titles = Array.from(
      titleLayer.querySelectorAll<HTMLElement>("[data-title-x]"),
    ).map((element) => ({ element, x: Number(element.dataset.titleX) }));
    const reveals = [
      ...listLayer.querySelectorAll<HTMLElement>("[data-reveal-x]"),
      ...titleLayer.querySelectorAll<HTMLElement>("[data-reveal-x]"),
    ].map((element) => ({
      element,
      x: Number(element.dataset.revealX),
      width: Number(element.dataset.revealWidth),
    }));
    const labels = Array.from(
      gridLayer.querySelectorAll<HTMLElement>("[data-label]"),
    ).map((element) => ({ element, height: element.offsetHeight }));

    return engine.onFrame(() => {
      const p = engine.morph.x;
      const { listX, gridY, W } = engine;

      listLayer.style.transform = `translate3d(${-listX}px, 0, 0)`;
      listLayer.style.opacity = String(p);
      listLayer.dataset.direction = String(engine.scrollDirection);
      gridLayer.style.transform = `translate3d(0, ${-gridY}px, 0)`;
      gridLayer.style.opacity = String(1 - p);
      titleLayer.dataset.direction = String(engine.scrollDirection);
      for (const { element, x } of titles) {
        element.style.transform = `translate3d(${x - listX}px, 0, 0)`;
        element.style.opacity = String(p);
      }

      if (p > 0) {
        for (const { element, x, width } of reveals) {
          const left = x - listX;
          const margin = Math.min(width, W) * 0.2;
          setFlag(
            element,
            "data-in",
            left + margin < W && left + width - margin > 0,
          );
        }
      }

      let activeLabel = 0;
      layout.grid.rows.forEach((row, index) => {
        const label = labels[index];
        if (!label) return;
        const stuck = Math.min(
          Math.max(gridY + GRID.paddingY - row.y, 0),
          Math.max(row.h - label.height, 0),
        );
        label.element.style.transform = `translate3d(0, ${stuck}px, 0)`;
        if (row.y <= gridY + ACTIVE_LABEL_OFFSET) activeLabel = index;
      });
      labels.forEach(({ element }, index) => {
        setFlag(element, "data-active", index === activeLabel);
      });
    });
  }, [engine, layout]);

  const centerFocusedElement = (event: React.FocusEvent<HTMLElement>) => {
    const position = event.target.dataset.scrollPosition;
    if (position && event.target.matches(":focus-visible")) {
      engine.scrollTo(Number(position));
    }
  };

  const coverWidth = layout.H * LIST.coverWidthRatio;

  return (
    <>
      <meta name="theme-color" content={dark ? "#000" : "#fff"} />
      <div
        className={cn(
          "fixed inset-0 -z-10 transition-colors duration-300",
          dark ? "bg-black" : "bg-white",
        )}
      />
      {useCanvas && (
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      )}

      <div ref={titlesRef}>
        {albums.map((album, albumIndex) => (
          <h1
            key={album.id}
            data-title-x={layout.list.albums[albumIndex].x}
            data-reveal-x={layout.list.albums[albumIndex].x + coverWidth * 0.3}
            data-reveal-width={coverWidth * 0.4}
            className="fixed left-0 top-0 flex items-center justify-center gap-1 text-4xl font-display text-neutral-50 mix-blend-plus-lighter tracking-tight pointer-events-none"
            style={{ width: coverWidth, height: layout.H }}
          >
            <CoverTitle name={album.name} animated />
          </h1>
        ))}
      </div>

      <div
        inert={view !== "list"}
        onFocus={centerFocusedElement}
        className="fixed inset-0 overflow-clip z-10"
      >
        <div ref={listLayerRef} className="absolute left-0 top-0 opacity-0">
          {albums.map((album, albumIndex) => {
            const albumRect = layout.list.albums[albumIndex];
            return (
              <React.Fragment key={album.id}>
                <button
                  type="button"
                  aria-label={`${album.name}: show in grid`}
                  data-scroll-position={albumRect.x}
                  onClick={() => engine.showAlbumInGrid(albumIndex)}
                  className="absolute rounded cursor-pointer overflow-hidden"
                  style={boxStyle(albumRect.cover)}
                >
                  {!useCanvas && (
                    <>
                      <span
                        className="absolute inset-0 bg-center bg-cover saturate-40"
                        style={{
                          backgroundImage: `url(${fullSrc(coverPhotoOf(album).filename)})`,
                        }}
                      />
                      <span
                        className="absolute inset-0 opacity-40"
                        style={{ backgroundColor: accentColor(albumIndex) }}
                      />
                    </>
                  )}
                </button>
                {album.photos.map((photo) => {
                  const rect = layout.list.photos.get(photo.filename);
                  if (!rect) return null;
                  return (
                    <React.Fragment key={photo.filename}>
                      <button
                        type="button"
                        aria-label={`${photo.location}, ${formatDate(photo.date)}: show in grid`}
                        data-scroll-position={
                          rect.x + rect.w / 2 - layout.W / 2
                        }
                        onClick={() => engine.showPhotoInGrid(photo.filename)}
                        className="absolute rounded-sm cursor-pointer overflow-hidden"
                        style={boxStyle(rect)}
                      >
                        {!useCanvas && (
                          <img
                            src={fullSrc(photo.filename)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                      {photo.location && photo.date && (
                        <figcaption
                          data-reveal-x={rect.x}
                          data-reveal-width={rect.w}
                          className={cn(
                            "caption absolute flex gap-2 text-sm whitespace-nowrap",
                            album.dark ? "text-white" : "text-neutral-900",
                          )}
                          style={{
                            left: rect.x,
                            top: rect.y + rect.h + LIST.captionGap,
                          }}
                        >
                          <p>{photo.location}</p>
                          <p
                            className={
                              album.dark
                                ? "text-white/60"
                                : "text-neutral-900/50"
                            }
                          >
                            {formatDate(photo.date)}
                          </p>
                        </figcaption>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div
        inert={view !== "grid"}
        onFocus={centerFocusedElement}
        className="fixed inset-0 overflow-clip z-20"
      >
        <div ref={gridLayerRef} className="absolute left-0 top-0">
          {albums.map((album, albumIndex) => {
            const row = layout.grid.rows[albumIndex];
            return (
              <React.Fragment key={album.id}>
                <div
                  data-label
                  className="group absolute left-0"
                  style={{ top: row.y }}
                >
                  <button
                    type="button"
                    data-scroll-position={row.y}
                    aria-label={`${album.name}: show in list`}
                    onClick={() => engine.showAlbumInList(albumIndex)}
                    className="text-lg font-display text-neutral-400 hover:text-neutral-900 group-data-active:text-neutral-900 tracking-wider aspect-square whitespace-nowrap flex items-start transition-colors cursor-pointer -rotate-90 translate-x-5.5"
                  >
                    <span className="block">{album.name}</span>
                  </button>
                </div>
                {album.photos.map((photo) => {
                  const rect = layout.grid.photos.get(photo.filename);
                  if (!rect) return null;
                  return (
                    <button
                      key={photo.filename}
                      type="button"
                      aria-label={`${photo.location}, ${formatDate(photo.date)}: show in list`}
                      data-scroll-position={rect.y + rect.h / 2 - layout.H / 2}
                      onClick={() => engine.showPhotoInList(photo.filename)}
                      onPointerEnter={() =>
                        engine.setHoveredPhoto(photo.filename)
                      }
                      onPointerLeave={() => engine.setHoveredPhoto(null)}
                      className="absolute rounded-xs cursor-pointer overflow-hidden"
                      style={boxStyle(rect)}
                    >
                      {!useCanvas && (
                        <img
                          src={thumbSrc(photo.filename)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <GroupingMenu
        grouping={grouping}
        visible={view === "grid"}
        onSelect={onGroupingChange}
      />
      <Scrubber engine={engine} />
      <Toggle view={view} onToggle={() => engine.toggleView()} />
    </>
  );
};
