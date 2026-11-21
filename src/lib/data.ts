import payload from "@/data.json";

export interface Photo {
  id: number;
  date: string;
  location: string;
  filename: string;
  width: number;
  height: number;
  cover?: boolean;
}

export interface Album {
  id: number | string;
  name: string;
  dark: boolean;
  photos: Photo[];
}

export type Grouping = "memory" | "year" | "country";

export const ALBUMS: Album[] = payload;

export const ACCENT_COLORS = [
  "hsl(126, 40%, 40%)",
  "hsl(0, 40%, 40%)",
  "#90a1b9",
  "hsl(45, 40%, 40%)",
  "hsl(166, 40%, 40%)",
];

export const accentColor = (albumIndex: number) =>
  ACCENT_COLORS[albumIndex % ACCENT_COLORS.length];

const variant = (prefix: string) => (filename: string) =>
  `/${prefix}${filename.replace(/\.\w+$/, ".webp")}`;

export const thumbSrc = variant("t");
export const fullSrc = variant("f");

export const coverPhotoOf = (album: Album) =>
  album.photos.find((photo) => photo.cover) ??
  album.photos.find((photo) => photo.width > photo.height) ??
  album.photos[0];

export const yearOf = (photo: Photo) => photo.date.split("/")[2];

export const countryOf = (photo: Photo) =>
  photo.location.split(",").at(-1)?.trim() ?? "";

export function formatDate(date: string) {
  const fullDate = new Date(date);
  const month = fullDate.toLocaleDateString("en-US", { month: "short" });
  return `${month}, ${fullDate.getFullYear()}`;
}

function groupBy(
  albums: Album[],
  keyOf: (photo: Photo) => string,
  compare: (a: string, b: string) => number,
): Album[] {
  const groups = new Map<string, Photo[]>();

  for (const photo of albums.flatMap((album) => album.photos)) {
    const key = keyOf(photo);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), photo]);
  }

  return [...groups.keys()].sort(compare).map((key) => ({
    id: key,
    name: key,
    dark: false,
    photos: groups.get(key) ?? [],
  }));
}

export function groupAlbums(grouping: Grouping): Album[] {
  if (grouping === "year") {
    return groupBy(ALBUMS, yearOf, (a, b) => Number(a) - Number(b));
  }
  if (grouping === "country") {
    return groupBy(ALBUMS, countryOf, (a, b) => a.localeCompare(b));
  }
  return ALBUMS;
}
