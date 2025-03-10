const LANDSCAPE_RATIO = 1.5;
const PORTRAIT_RATIO = 0.66;
const PHOTO_SIZE_RATIO = 0.8;

export interface ScrollMetadata {
  albumLength: number;
  portraitLength: number;
  landscapeLength: number;
}

export interface ScrollCalculation {
  horizontalScrollLength: number;
  ratio: number;
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

export function calculateScrollView(
  metadata: ScrollMetadata,
  photoPadding: number,
  totalScrollLength?: number,
): ScrollCalculation {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const heightWithRatio = (screenHeight + photoPadding * 2) * PHOTO_SIZE_RATIO;

  let horizontalScrollLength = 0;

  // cover
  horizontalScrollLength += metadata.albumLength * screenWidth;

  // portrait
  horizontalScrollLength +=
    metadata.portraitLength * (heightWithRatio * PORTRAIT_RATIO);

  // landscape
  horizontalScrollLength +=
    metadata.landscapeLength * (heightWithRatio * LANDSCAPE_RATIO);

  // extra padding
  horizontalScrollLength += photoPadding;

  // Calculate ratio based on whether we're calculating for timeline or scroller
  const ratio = totalScrollLength
    ? (horizontalScrollLength / totalScrollLength) * 100
    : horizontalScrollLength / screenWidth;

  return {
    horizontalScrollLength,
    ratio,
  };
}
