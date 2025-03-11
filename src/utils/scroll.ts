const LANDSCAPE_RATIO = 1.5;
const PORTRAIT_RATIO = 0.66;
const PHOTO_SIZE_RATIO = 0.8;

export interface ScrollMetadata {
  albumLength: number;
  portraitLength: number;
  landscapeLength: number;
}

export function getPhotoPadding(): number {
  const imageWrapper = document.querySelector(".image-wrapper");
  if (!imageWrapper) {
    throw new Error("`.image-wrapper` not found");
  }

  return Number(
    window
      .getComputedStyle(imageWrapper)
      .getPropertyValue("padding-left")
      .replace("px", ""),
  );
}

export function calculateScrollViewLength(
  metadata: ScrollMetadata,
  photoPadding: number,
  totalScrollLength?: number,
) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const heightWithRatio = (screenHeight + photoPadding * 2) * PHOTO_SIZE_RATIO;

  let length = 0;

  // cover
  length += metadata.albumLength * screenWidth;

  // portrait
  length += metadata.portraitLength * (heightWithRatio * PORTRAIT_RATIO);

  // landscape
  length += metadata.landscapeLength * (heightWithRatio * LANDSCAPE_RATIO);

  // extra padding between photos
  length +=
    photoPadding * metadata.portraitLength +
    photoPadding * metadata.landscapeLength;

  // extra padding at the end of the last photo
  length += photoPadding * metadata.albumLength;

  // Calculate ratio based on whether we're calculating for timeline or scroller
  const ratio = totalScrollLength
    ? (length / totalScrollLength) * 100
    : length / screenWidth;

  return [length, ratio];
}
