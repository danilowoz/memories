import React from "react";
import { Scroller } from "../components/scroller";
import { Timeline } from "../components/timeline";
import payload from "@/data.json";
import type { Photo } from "@/utils/types";
import { MAP_COLORS } from "@/utils/colors";

export default async function Home() {
  return (
    <Scroller payload={payload}>
      {payload.map((item) => {
        return (
          <Album
            key={item.id}
            name={item.name}
            photos={item.photos.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )}
            id={item.id}
          />
        );
      })}
    </Scroller>
  );
}

const Album = async ({
  name,
  photos,
  id,
}: { name: string; photos: Photo[]; id: string | number }) => {
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

  const coverPhoto = photos.find((photo) => photo.cover);

  return (
    <>
      <div className="item min-w-screen min-h-screen flex relative">
        <div
          style={{
            backgroundImage: `url(/media/${coverPhoto?.filename})`,
          }}
          className="absolute inset-0 bg-center saturate-20 bg-cover"
        />
        <div
          style={{ backgroundColor: MAP_COLORS[id as keyof typeof MAP_COLORS] }}
          className="absolute inset-0 opacity-70 "
        />
        <h2 className="m-auto font-serif text-[60px] text-gray-50 mix-blend-plus-lighter">
          {renderTitle()}
        </h2>
      </div>

      {photos.map((item) => (
        <figure key={item.id} className="flex">
          <div className="image-wrapper m-auto px-40">
            {item.filename && (
              <img
                className="h-[80vh] max-w-none"
                src={`/media/${item.filename}`}
                alt={item.location}
              />
            )}

            <figcaption className="pt-4">
              <p className="text-gray-900 font-semibold">{item.location}</p>
              <small className="text-gray-600 uppercase">
                {formatDate(item.date)}
              </small>
            </figcaption>
          </div>
        </figure>
      ))}
    </>
  );
};

function formatDate(date: string) {
  const fullDate = new Date(date);

  const month = fullDate.toLocaleDateString("en-US", {
    month: "long",
  });

  const year = fullDate.toLocaleDateString("en-US", {
    year: "numeric",
  });

  return `${month}, ${year}`;
}
