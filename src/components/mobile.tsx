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
import type { View } from "@/lib/engine";
import React from "react";
import { GroupingMenu, Toggle } from "./controls";
import { CoverTitle } from "./cover-title";
import { LogoIcon } from "./icons";

const listId = (key: string | number) => `list-${key}`;
const gridId = (key: string | number) => `grid-${key}`;

export const Mobile = ({
  albums,
  grouping,
  onGroupingChange,
}: {
  albums: Album[];
  grouping: Grouping;
  onGroupingChange: (grouping: Grouping) => void;
}) => {
  const [view, setView] = React.useState<View>("grid");
  const [scrollTarget, setScrollTarget] = React.useState<string | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

  const show = (nextView: View, targetId: string | null) => {
    setView(nextView);
    setScrollTarget(targetId);
  };

  React.useEffect(() => {
    document.body.style.overflow = view === "grid" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [view]);

  React.useEffect(() => {
    if (!scrollTarget) return;
    document.getElementById(scrollTarget)?.scrollIntoView({ block: "center" });
    setScrollTarget(null);
  }, [scrollTarget]);

  const selectGrouping = (next: Grouping) => {
    onGroupingChange(next);
    gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <main inert={view !== "list"} className="flex flex-col gap-12 pb-20">
        {albums.map((album, albumIndex) => (
          <section
            key={album.id}
            className={cn("flex flex-col gap-12", album.dark && "bg-black")}
          >
            <button
              type="button"
              id={listId(album.id)}
              aria-label={`${album.name}: show in grid`}
              onClick={() => show("grid", gridId(album.id))}
              className="relative flex min-h-[6em] w-full overflow-hidden"
            >
              <span
                className="absolute inset-0 bg-center bg-cover saturate-40"
                style={{
                  backgroundImage: `url(${thumbSrc(coverPhotoOf(album).filename)})`,
                }}
              />
              <span
                className="absolute inset-0 opacity-40"
                style={{ backgroundColor: accentColor(albumIndex) }}
              />
              <span className="relative m-auto flex gap-1 text-[30px] font-display text-neutral-50 mix-blend-plus-lighter tracking-tight">
                <CoverTitle name={album.name} animated={false} />
              </span>
            </button>

            {album.photos.map((photo) => (
              <figure key={photo.filename} id={listId(photo.filename)}>
                <img
                  src={fullSrc(photo.filename)}
                  alt={`${photo.location}, ${formatDate(photo.date)}`}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto bg-neutral-100"
                />
                {photo.location && photo.date && (
                  <figcaption
                    className={cn(
                      "p-4 flex gap-2 text-sm",
                      album.dark ? "text-white" : "text-neutral-900",
                    )}
                  >
                    <p>{photo.location}</p>
                    <p
                      className={
                        album.dark ? "text-white/60" : "text-neutral-900/50"
                      }
                    >
                      {formatDate(photo.date)}
                    </p>
                  </figcaption>
                )}
              </figure>
            ))}
          </section>
        ))}
      </main>

      <div
        ref={gridRef}
        inert={view !== "grid"}
        className={cn(
          "fixed inset-0 z-20 overflow-auto bg-white pb-24 transition-opacity duration-300 motion-reduce:transition-none",
          view === "grid" ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {albums.map((album) => (
          <section key={album.id}>
            <button
              type="button"
              id={gridId(album.id)}
              aria-label={`${album.name}: show in list`}
              onClick={() => show("list", listId(album.id))}
              className="w-full flex gap-4 items-center p-4 text-lg font-display text-neutral-900 tracking-wider"
            >
              <LogoIcon className="w-5 h-5" />
              {album.name}
            </button>
            <div className="flex flex-col gap-4">
              {album.photos.map((photo) => (
                <img
                  key={photo.filename}
                  src={thumbSrc(photo.filename)}
                  alt={`${photo.location}, ${formatDate(photo.date)}`}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto bg-neutral-100"
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <GroupingMenu
        grouping={grouping}
        visible={view === "grid"}
        onSelect={selectGrouping}
      />
      <Toggle
        view={view}
        onToggle={() => show(view === "grid" ? "list" : "grid", null)}
      />
    </>
  );
};
