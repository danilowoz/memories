"use client";

import { Provider } from "@/components/context";
import { Cover } from "@/components/cover";
import { Image } from "@/components/image";
import payload from "@/data.json";
import { cn } from "@/utils/classname";
import type { Photo } from "@/utils/types";
import { motion } from "framer-motion";
import { Scroller } from "../components/scroller";

export default function Home() {
  return (
    <Provider>
      <Scroller>
        {payload.map((item, index) => {
          return (
            <Album
              key={item.id}
              name={item.name}
              photos={item.photos as Photo[]}
              id={item.id}
              dark={item.dark}
              isLast={index === payload.length - 1}
            />
          );
        })}
      </Scroller>
    </Provider>
  );
}

const Album = ({
  name,
  photos,
  id,
  dark,
  isLast,
}: {
  name: string;
  photos: Photo[];
  id: string | number;
  dark: boolean;
  isLast: boolean;
}) => {
  const coverPhoto = photos.find((photo) => photo.cover);

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:flex-nowrap gap-12 md:gap-0",
        {
          "bg-black sm:bg-transparent": dark,
        },
      )}
    >
      <div
        className="item min-h-[6em] min-w-[calc(100vh*1.4)] md:min-h-screen flex relative"
        style={
          {
            "--color": `var(--color-${id})`,
          } as React.CSSProperties
        }
      >
        <Cover name={name} src={coverPhoto?.filename ?? ""} />
      </div>

      {photos.map((item, index) => (
        <motion.figure
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            ease: "easeOut",
            delay: 1.2,
            duration: 0.6,
          }}
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
          />
        </motion.figure>
      ))}
    </div>
  );
};
