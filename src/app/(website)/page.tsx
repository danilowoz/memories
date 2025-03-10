import "./globals.css";
import React from "react";
import { Scroller } from "./scroller";
import { Timeline } from "./timeline";
import payload from "@/app/data.json";

type Media = {
  id: string | number;
  url: string;
  width: number;
  height: number;
  location: string;
  date: string;
};

const MAP_COLORS = {
  "1": "#679668",
  "2": "#966767",
} as const;

export default async function Home() {
  const allMedias = payload.flatMap((item) => item.photos);

  const mediaMetaData = allMedias.reduce(
    (acc, item) => {
      if (item.width > item.height) {
        acc.landscape += 1;
      } else {
        acc.portrait += 1;
      }
      return acc;
    },
    { portrait: 0, landscape: 0 },
  );

  return (
    <Scroller
      albumLength={payload.length}
      portraitLength={mediaMetaData.portrait}
      landscapeLength={mediaMetaData.landscape}
    >
      {payload.map((item) => {
        return (
          <Album
            key={item.id}
            name={item.name}
            photos={item.photos}
            id={item.id}
          />
        );
      })}

      <Timeline />
    </Scroller>
  );
}

const Album = async ({
  name,
  photos,
  id,
}: { name: string; photos: Media[]; id: string | number }) => {
  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    if (leftSide) {
      return (
        <>
          <span>Memories</span>
          <span className="opacity-40">{name.replace("Memories", "")}</span>
        </>
      );
    }

    return (
      <>
        <span className="opacity-40">{name.replace("Memories", "")}</span>
        <span>Memories</span>
      </>
    );
  };

  return (
    <>
      <div className="item min-w-screen min-h-screen flex relative">
        <div
          style={{ backgroundImage: `url(${photos[0].url})` }}
          className="absolute inset-0 bg-center saturate-20"
        />
        <div
          style={{ backgroundColor: MAP_COLORS[id as keyof typeof MAP_COLORS] }}
          className="absolute inset-0 opacity-70"
        />
        <h2 className="m-auto font-serif text-[60px] text-gray-50 mix-blend-plus-lighter">
          {renderTitle()}
        </h2>
      </div>

      {photos.map((item) => (
        <figure key={item.id} className="flex">
          <div className="image-wrapper m-auto px-40">
            {item.url && (
              <img className="h-[80vh] max-w-none" src={item.url} alt="" />
            )}

            <figcaption className="pt-4">
              <p className="text-gray-900 font-semibold">{item.location}</p>
              <small className="text-gray-600 uppercase">{item.date}</small>
            </figcaption>
          </div>
        </figure>
      ))}
    </>
  );
};
