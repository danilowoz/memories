import { Scroller } from "../components/scroller";
import { Timeline } from "../components/timeline";
import payload from "@/data.json";
import type { Memories, Photo } from "@/utils/types";
import { MAP_COLORS } from "@/utils/colors";
import { cn } from "@/utils/classname";

export default async function Home() {
  return (
    <Scroller payload={payload as Memories}>
      {payload.map((item) => {
        const sortedPhotos = item.photos.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ) as Photo[];

        return (
          <Album
            key={item.id}
            name={item.name}
            photos={sortedPhotos}
            id={item.id}
            dark={item.dark}
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
  dark,
}: { name: string; photos: Photo[]; id: string | number; dark: boolean }) => {
  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    if (leftSide) {
      return (
        <>
          <span>Memories</span>
          <span className="opacity-30">{name.replace("Memories", "")}</span>
        </>
      );
    }

    return (
      <>
        <span className="opacity-30">{name.replace("Memories", "")}</span>
        <span>Memories</span>
      </>
    );
  };

  const coverPhoto = photos.find((photo) => photo.cover);

  return (
    <>
      <div
        className="item min-w-screen min-h-screen flex relative"
        style={
          {
            "--color": MAP_COLORS[id as keyof typeof MAP_COLORS],
          } as React.CSSProperties
        }
      >
        <div
          style={{
            backgroundImage: `url(/media/${coverPhoto?.filename})`,
          }}
          className="absolute inset-0 bg-center saturate-20 bg-cover"
        />
        <div
          style={{ backgroundColor: "var(--color)" }}
          className="absolute inset-0 opacity-70 "
        />
        <h2 className="m-auto font-serif text-[60px] text-gray-50 mix-blend-plus-lighter">
          {renderTitle()}
        </h2>
      </div>

      {photos.map((item, index) => (
        <figure
          key={item.id}
          className={cn("flex", {
            "pl-40": index === 0,
            "pr-40": index === photos.length - 1,
            "bg-black": dark,
          })}
        >
          <div className="image-wrapper m-auto px-40">
            {item.filename && (
              <img
                className="h-[80vh] max-w-none"
                src={`/media/${item.filename}`}
                alt={item.location}
              />
            )}

            <figcaption className="pt-4">
              <p
                className={cn("text-gray-900 font-semibold", {
                  "text-white": dark,
                })}
              >
                {item.location}
              </p>
              <small
                className={cn("text-gray-600 uppercase", {
                  "text-white opacity-50": dark,
                })}
              >
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
