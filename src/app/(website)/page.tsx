import config from "@payload-config";
import { getPayload } from "payload";
import "./globals.css";
import React from "react";
import { Scroller } from "./scroller";

const MAP_COLORS = {
  "1": "#679668",
  "2": "#966767",
} as const;

export default async function Home() {
  const payload = await getPayload({ config });
  const { docs: album } = await payload.find({
    collection: "album",
    where: { enabled: { equals: true } },
  });

  const { docs: allMedia } = await payload.find({
    collection: "media",
    where: { enabled: { equals: true } },
  });

  const mediaMetaData = allMedia.reduce(
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
      albumLength={album.length}
      portraitLength={mediaMetaData.portrait}
      landscapeLength={mediaMetaData.landscape}
    >
      {album.map((item) => {
        return <Album key={item.id} id={item.id} />;
      })}
    </Scroller>
  );
}

const Album = async ({ id }: { id: string | number }) => {
  const payload = await getPayload({ config });
  const { docs: media } = await payload.find({
    collection: "media",
    where: { album: { equals: id }, enabled: { equals: true } },
  });

  const album = await payload.findByID({
    collection: "album",
    id: id,
  });

  const renderTitle = () => {
    const leftSide = album.name.indexOf("Memories") === 0;

    if (leftSide) {
      return (
        <>
          <span>Memories</span>
          <span className="opacity-40">
            {album.name.replace("Memories", "")}
          </span>
        </>
      );
    }

    return (
      <>
        <span className="opacity-40">{album.name.replace("Memories", "")}</span>
        <span>Memories</span>
      </>
    );
  };

  return (
    <>
      <div className="item min-w-screen min-h-screen flex relative">
        <div
          style={{ backgroundImage: `url(${media[0].url})` }}
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

      {media.map((item) => (
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
