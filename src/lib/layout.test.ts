import assert from "node:assert/strict";
import { test } from "node:test";
import type { Album } from "./data.ts";
import { computeLayout } from "./layout.ts";

const photo = (filename: string, width: number, height: number) => ({
  id: 0,
  date: "01/01/2025",
  location: "Porto, Portugal",
  filename,
  width,
  height,
});

const albums: Album[] = [
  {
    id: 1,
    name: "A",
    dark: false,
    photos: [photo("a1", 1000, 1500), photo("a2", 1500, 1000)],
  },
  { id: 2, name: "B", dark: true, photos: [photo("b1", 1000, 1500)] },
];

const layout = computeLayout(albums, 1440, 900);

test("list: cover is 140vh wide, inset 24px, 64px from the bottom", () => {
  assert.deepEqual(layout.list.albums[0].cover, {
    x: 24,
    y: 24,
    w: 1260 - 48,
    h: 900 - 88,
  });
});

test("list: photos are full height minus 112px and keep their aspect ratio", () => {
  const first = layout.list.photos.get("a1");
  assert.deepEqual(first, {
    x: 1260 + 40 + 144,
    y: 24,
    w: (788 * 2) / 3,
    h: 788,
  });
  const second = layout.list.photos.get("a2");
  assert.equal(second?.x, (first?.x ?? 0) + (first?.w ?? 0) + 288);
  assert.equal(second?.w, 788 * 1.5);
});

test("list: 40px edge after every album but the last", () => {
  const [a, b] = layout.list.albums;
  const lastOfA = layout.list.photos.get("a2");
  assert.equal(a.width, (lastOfA?.x ?? 0) + (lastOfA?.w ?? 0) + 144 + 40);
  const lastOfB = layout.list.photos.get("b1");
  assert.equal(layout.list.width, (lastOfB?.x ?? 0) + (lastOfB?.w ?? 0) + 144);
  assert.equal(b.x, a.width);
});

test("grid: 4 columns with 96px gaps, 288px thumbnails, 16px apart", () => {
  const column = (1440 - 288) / 4;
  assert.equal(layout.grid.photosX, column + 96);
  assert.deepEqual(layout.grid.photos.get("a1"), {
    x: column + 96,
    y: 16,
    w: 192,
    h: 288,
  });
  assert.deepEqual(layout.grid.photos.get("a2"), {
    x: column + 96 + 192 + 16,
    y: 16,
    w: 432,
    h: 288,
  });
  assert.equal(layout.grid.rows[1].y, 16 + 288 + 96);
});

test("grid: thumbnails wrap inside the three photo columns", () => {
  const many: Album[] = [
    {
      id: 1,
      name: "A",
      dark: false,
      photos: Array.from({ length: 6 }, (_, i) => photo(`p${i}`, 1000, 1500)),
    },
  ];
  const narrow = computeLayout(many, 1440, 900);
  assert.equal(narrow.grid.photos.get("p5")?.y, 16 + 288 + 16);
  assert.equal(narrow.grid.photos.get("p5")?.x, narrow.grid.photosX);
  assert.equal(narrow.grid.rows[0].h, 288 * 2 + 16);
});
