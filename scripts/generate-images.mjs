import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const THUMB_HEIGHT = 600;
const dataPath = new URL("../src/data.json", import.meta.url);
const publicDir = new URL("../public", import.meta.url).pathname;
const albums = JSON.parse(await readFile(dataPath, "utf8"));

const variantPath = (filename, prefix) =>
  `${publicDir}/${prefix}${filename.replace(/\.\w+$/, ".webp")}`;

for (const album of albums) {
  for (const photo of album.photos) {
    const source = sharp(`${publicDir}${photo.filename}`).rotate();
    const { width, height } = await source
      .clone()
      .toBuffer({ resolveWithObject: true })
      .then((result) => result.info);
    photo.width = width;
    photo.height = height;
    photo.format = undefined;

    const thumb = variantPath(photo.filename, "t");
    const full = variantPath(photo.filename, "f");
    await mkdir(dirname(thumb), { recursive: true });
    await mkdir(dirname(full), { recursive: true });
    await source
      .clone()
      .resize({ height: Math.min(THUMB_HEIGHT, height) })
      .webp({ quality: 75 })
      .toFile(thumb);
    await source.clone().webp({ quality: 88 }).toFile(full);
  }
}

await writeFile(dataPath, `${JSON.stringify(albums, null, 2)}\n`);
