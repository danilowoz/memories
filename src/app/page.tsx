import payload from "@/data.json";
import { cn } from "@/utils/classname";
import type { Memories, Photo } from "@/utils/types";
import { Scroller } from "../components/scroller";

export default async function Home() {
  return (
    <Scroller>
      {payload.map((item, index) => {
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
            isFirst={index === 0}
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
  isFirst,
}: {
  name: string;
  photos: Photo[];
  id: string | number;
  dark: boolean;
  isFirst: boolean;
}) => {
  const renderTitle = () => {
    const leftSide = name.indexOf("Memories") === 0;

    if (leftSide) {
      return (
        <>
          <span>Memories</span>
          <span className="opacity-20">{name.replace("Memories", "")}</span>
        </>
      );
    }

    return (
      <>
        <span className="opacity-20">{name.replace("Memories", "")}</span>
        <span>Memories</span>
      </>
    );
  };

  const coverPhoto = photos.find((photo) => photo.cover);

  return (
    <div className="flex flex-col md:flex-row md:flex-nowrap ">
      <div
        className={cn(
          "item min-h-[40vh] min-w-screen md:min-h-screen flex relative pointer-events-none",
          {
            "z-20": isFirst,
            "bg-black": dark,
          },
        )}
        style={
          {
            "--color": `var(--color-${id})`,
          } as React.CSSProperties
        }
      >
        <div
          style={{
            backgroundImage: `url(${coverPhoto?.filename})`,
          }}
          className={cn(
            "absolute inset-0 md:inset-6 md:bottom-12 md:rounded-lg bg-center saturate-20 bg-cover",
          )}
        />
        <div
          style={{ backgroundColor: "var(--color)" }}
          className={cn(
            "absolute inset-0 top-0 md:inset-6 md:bottom-12 md:rounded-lg opacity-70",
          )}
        />
        <h2 className="text-[30px] m-auto font-serif md:text-[60px] text-gray-50 mix-blend-plus-lighter">
          {renderTitle()}
        </h2>
      </div>

      {photos.map((item, index) => (
        <figure
          key={item.id}
          className={cn("md:flex", {
            "md:pl-40": index === 0,
            "md:pr-40": index === photos.length - 1,
            "bg-black": dark,
          })}
        >
          <div className="image-wrapper m-auto md:px-40">
            {item.filename && (
              <img
                className="w-full md:w-auto md:h-[80vh] max-w-none md:rounded"
                src={item.filename}
                alt={item.location}
              />
            )}

            {item.location && item.date && (
              <figcaption className="p-4 pb-10 md:p-0 md:pt-4">
                <p
                  className={cn("text-gray-900 font-semibold m-0", {
                    "text-white": dark,
                  })}
                >
                  {item.location}
                </p>
                <small
                  className={cn("text-gray-600 uppercase m-0", {
                    "text-white opacity-50": dark,
                  })}
                >
                  {formatDate(item.date)}
                </small>
              </figcaption>
            )}
          </div>
        </figure>
      ))}
    </div>
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
