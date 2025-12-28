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
  const [selectedAlbumId, setSelectedAlbumId] = React.useState(0);

  const menu = [
    // {
    //   label: "shuffle",
    //   onClick: () => {
    //     setAlbumsData((prev) => {
    //       return prev
    //         .map((item) => {
    //           return {
    //             ...item,
    //             photos: item.photos.sort(() => Math.random() - 0.5),
    //           };
    //         })
    //         .sort(() => Math.random() - 0.5);
    //     });
    //   },
    // },
    {
      label: "by memory",
      onClick: () => {
        setAlbumsData(payload);
      },
    },
    {
      label: "by year",
      onClick: () => {
        const allYears = payload
          .reduce<Memories>((acc, curr) => {
            for (const photo of curr.photos) {
              if (photo.date) {
                const year = photo.date.split("/")[2];

                if (!acc.find((item) => item.name === year)) {
                  const album: Memory = {
                    id: year,
                    name: year,
                    photos: [],
                    dark: false,
                  };

                  acc.push(album);
                }
              }
            }

            return acc;
          }, [])
          .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name));

        const byYear = payload.reduce((acc, album) => {
          for (const photo of album.photos) {
            if (photo.date) {
              const year = photo.date.split("/")[2];
              const index = acc.findIndex((item) => item.name === year);
              acc[index].photos.push(photo);
            }
          }

          return acc;
        }, allYears);

        setAlbumsData(byYear);
      },
    },
    {
      label: "by country",
      onClick: () => {
        const allCountries = payload
          .reduce<Memories>((acc, album) => {
            for (const photo of album.photos) {
              if (photo.location) {
                const country = photo.location.split(",")[1].trim();
                const index = acc.findIndex((item) => item.name === country);
                if (index === -1) {
                  const countryAlbum: Memory = {
                    id: country,
                    name: country,
                    photos: [],
                    dark: false,
                  };

                  acc.push(countryAlbum);
                }
              }
            }
            return acc;
          }, [])
          .sort((a, b) => a.name.localeCompare(b.name));

        const byCountry = payload.reduce((acc, album) => {
          for (const photo of album.photos) {
            if (photo.location) {
              const country = photo.location.split(",")[1].trim();
              const index = acc.findIndex((item) => item.name === country);
              acc[index].photos.push(photo);
            }
          }

          return acc;
        }, allCountries);

        setAlbumsData(byCountry);
      },
    },
  ];

  return (
    <Provider>
      <ListView payload={albumsData}>
        {albumsData.map((item, index) => {
          return (
            <Album
              key={item.id}
              name={item.name}
              photos={item.photos as Photo[]}
              albumIndex={index % 3}
              dark={item.dark}
              isLast={index === payload.length - 1}
            />
          );
        })}

        <GridView payload={albumsData}>
          <div className="fixed bottom-[22px] left-20 z-30 flex gap-6">
            {menu.map((item, index) => {
              return (
                <button
                  key={item.label}
                  className="text-neutral-400 text-sm font-display cursor-pointer hover:text-neutral-900 transition-colors flex items-center gap-2 ml-2 data-[selected='true']:text-neutral-900"
                  type="button"
                  data-selected={selectedAlbumId === index}
                  onClick={() => {
                    setSelectedAlbumId(index);
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </GridView>
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
          src={coverPhoto?.filename ?? randomPhoto.filename ?? ""}
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
