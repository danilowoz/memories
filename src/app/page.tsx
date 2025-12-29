"use client";

import { Provider } from "@/components/context";
import { Cover } from "@/components/cover";
import { GridView } from "@/components/grid-view";
import { Image } from "@/components/image";
import { Toggle } from "@/components/toggle";
import payload from "@/data.json";
import { cn } from "@/utils/classname";
import type { Memories, Memory, Photo } from "@/utils/types";
import React from "react";
import { ListView } from "../components/list-view";

export default function Home() {
  const [albumsData, setAlbumsData] = React.useState<Memories>(payload);

  return (
    <Provider>
      <ListView payload={albumsData}>
        {albumsData.map((item, index) => {
          return (
            <Album
              key={item.id}
              name={item.name}
              photos={item.photos as Photo[]}
              albumIndex={index}
              dark={item.dark}
              isLast={index === payload.length - 1}
            />
          );
        })}

        <GridView setAlbumsData={setAlbumsData} payload={albumsData} />
      </ListView>

      <Toggle />
    </Provider>
  );
}

const Album = ({
  name,
  photos,
  albumIndex,
  dark,
  isLast,
}: {
  name: string;
  photos: Photo[];
  albumIndex: number;
  dark: boolean;
  isLast: boolean;
}) => {
  const coverPhoto = photos.find((photo) => photo.cover);
  const firstLandscapePhoto = photos.find(
    (photo) => photo.format === "landscape",
  );
  const randomPhoto = photos[Math.floor(Math.random() * photos.length)];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:flex-nowrap gap-12 md:gap-0",
        {
          "bg-black sm:bg-transparent": dark,
        },
      )}
    >
      <div className="item min-h-[6em] md:min-w-[calc(100vh*1.4)] md:min-h-screen flex relative overflow-hidden">
        <Cover
          albumIndex={albumIndex}
          name={name}
          src={
            coverPhoto?.filename ??
            firstLandscapePhoto?.filename ??
            randomPhoto.filename ??
            ""
          }
        />
      </div>

      {photos.map((item, index) => (
        <figure
          key={item.id}
          className={cn("md:flex", {
            "md:pl-10": index === 0,
            "md:pr-10": index === photos.length - 1 && !isLast,
          })}
        >
          <Image
            src={item.filename}
            alt={item.location}
            location={item.location}
            date={item.date}
            dark={dark}
            format={item.format}
          />
        </figure>
      ))}
    </div>
  );
};
