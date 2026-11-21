import type { Album } from "./data.ts";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  W: number;
  H: number;
  list: {
    width: number;
    albums: { x: number; width: number; cover: Rect }[];
    photos: Map<string, Rect>;
  };
  grid: {
    height: number;
    photosX: number;
    rows: { y: number; h: number }[];
    photos: Map<string, Rect>;
  };
}

export const LIST = {
  coverWidthRatio: 1.4,
  coverInset: 24,
  coverBottom: 64,
  photoTop: 24,
  photoBottom: 88,
  photoSide: 144,
  albumEdge: 40,
  captionGap: 8,
};

export const GRID = {
  columns: 4,
  gap: 96,
  paddingY: 16,
  thumbHeight: 288,
  thumbGap: 16,
};

function layoutList(albums: Album[], H: number): Layout["list"] {
  const photos = new Map<string, Rect>();
  const photoHeight = H - LIST.photoTop - LIST.photoBottom;
  let x = 0;

  const albumRects = albums.map((album, albumIndex) => {
    const albumX = x;
    const coverWidth = H * LIST.coverWidthRatio;
    const cover = {
      x: albumX + LIST.coverInset,
      y: LIST.coverInset,
      w: coverWidth - LIST.coverInset * 2,
      h: H - LIST.coverInset - LIST.coverBottom,
    };
    x += coverWidth;

    album.photos.forEach((photo, index) => {
      const w = (photoHeight * photo.width) / photo.height;
      const isLastOfAlbum = index === album.photos.length - 1;
      const isLastAlbum = albumIndex === albums.length - 1;

      if (index === 0) x += LIST.albumEdge;
      x += LIST.photoSide;
      photos.set(photo.filename, { x, y: LIST.photoTop, w, h: photoHeight });
      x += w + LIST.photoSide;
      if (isLastOfAlbum && !isLastAlbum) x += LIST.albumEdge;
    });

    return { x: albumX, width: x - albumX, cover };
  });

  return { width: x, albums: albumRects, photos };
}

function layoutGrid(albums: Album[], W: number, H: number): Layout["grid"] {
  const photos = new Map<string, Rect>();
  const column = (W - GRID.gap * (GRID.columns - 1)) / GRID.columns;
  const photosX = column + GRID.gap;
  const photosWidth = W - photosX;
  let y = GRID.paddingY;

  const rows = albums.map((album) => {
    const rowY = y;
    let x = 0;
    let lineY = rowY;

    for (const photo of album.photos) {
      const w = (GRID.thumbHeight * photo.width) / photo.height;
      if (x > 0 && x + w > photosWidth) {
        x = 0;
        lineY += GRID.thumbHeight + GRID.thumbGap;
      }
      photos.set(photo.filename, {
        x: photosX + x,
        y: lineY,
        w,
        h: GRID.thumbHeight,
      });
      x += w + GRID.thumbGap;
    }

    const h = lineY + GRID.thumbHeight - rowY;
    y += h + GRID.gap;
    return { y: rowY, h };
  });

  const height = Math.max(H, y - GRID.gap + GRID.paddingY);
  return { height, photosX, rows, photos };
}

export function computeLayout(albums: Album[], W: number, H: number): Layout {
  return {
    W,
    H,
    list: layoutList(albums, H),
    grid: layoutGrid(albums, W, H),
  };
}
