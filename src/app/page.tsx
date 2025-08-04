import { Provider } from "@/components/context";
import { Cover } from "@/components/cover";
import { Cursor } from "@/components/cursor";
import { Image } from "@/components/image";
import payload from "@/data.json";
import { cn } from "@/utils/classname";
import type { Photo } from "@/utils/types";
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
        className="item min-h-[6em] min-w-screen md:min-h-screen flex relative"
        style={
          {
            "--color": `var(--color-${id})`,
          } as React.CSSProperties
        }
      >
        <Cover name={name} src={coverPhoto?.filename ?? ""} />
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
