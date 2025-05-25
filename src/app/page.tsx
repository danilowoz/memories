import { Cover } from "@/components/cover";
import { Image } from "@/components/image";
import payload from "@/data.json";
import { cn } from "@/utils/classname";
import type { Photo } from "@/utils/types";
import { Scroller } from "../components/scroller";

export default function Home() {
  return (
    <Scroller>
      {payload.map((item, index) => {
        const sortedPhotos = item.photos.sort((a, b) => {
          if ("date" in a && "date" in b) {
            return (
              new Date(a.date as string).getTime() -
              new Date(b.date as string).getTime()
            );
          }

          return 0;
        }) as Photo[];

        return (
          <Album
            key={item.id}
            name={item.name}
            photos={sortedPhotos}
            id={item.id}
            dark={item.dark}
            isLast={index === payload.length - 1}
            titlePosition={item.titlePosition}
          />
        );
      })}
    </Scroller>
  );
}

const Album = ({
  name,
  photos,
  id,
  dark,
  isLast,
  titlePosition,
}: {
  name: string;
  photos: Photo[];
  id: string | number;
  dark: boolean;
  isLast: boolean;
  titlePosition: string;
}) => {
  const coverPhoto = photos.find((photo) => photo.cover);

  return (
    <div className="flex flex-col md:flex-row md:flex-nowrap gap-12 md:gap-0">
      <div
        className="item min-h-[6em] min-w-screen md:min-h-screen flex relative"
        style={
          {
            "--color": `var(--color-${id})`,
          } as React.CSSProperties
        }
      >
        <Cover
          titlePosition={titlePosition}
          name={name}
          src={coverPhoto?.filename ?? ""}
        />
      </div>

      {photos.map((item, index) => (
        <figure
          key={item.id}
          className={cn("md:flex", {
            "md:pl-40": index === 0,
            "md:pr-40": index === photos.length - 1 && !isLast,
          })}
        >
          <Image
            src={item.filename}
            alt={item.location}
            location={item.location}
            date={item.date}
            dark={dark}
          />
        </figure>
      ))}
    </div>
  );
};
