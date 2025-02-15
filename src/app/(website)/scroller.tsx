"use client";

import React from "react";
import { cn } from "./utils";

const LANDSCAPE_RATIO = 1.5;
const PORTRAIT_RATIO = 0.66;
const PHOTO_SIZE_RATIO = 0.8;

export const Scroller = ({
	children,
	albumLength,
	portraitLength,
	landscapeLength,
}: {
	albumLength: number;
	portraitLength: number;
	landscapeLength: number;
	children: React.ReactNode;
}) => {
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const controller = new AbortController();

		const imageWrapper = document.querySelector(".image-wrapper");
		if (!imageWrapper) {
			throw new Error("`.image-wrapper` not found");
		}

		const photoPadding = Number(
			window
				.getComputedStyle(imageWrapper)
				.getPropertyValue("padding-left")
				.replace("px", ""),
		);

		function calcScrollView() {
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;

			const heightWithRatio =
				(screenHeight + photoPadding * 2) * PHOTO_SIZE_RATIO;

			let horizontalScrollLength = 0;
			horizontalScrollLength += albumLength * screenWidth;
			horizontalScrollLength +=
				portraitLength * (heightWithRatio * PORTRAIT_RATIO);
			horizontalScrollLength +=
				landscapeLength * (heightWithRatio * LANDSCAPE_RATIO);
			horizontalScrollLength += photoPadding; // extra padding, but I don't know why

			const ratio = horizontalScrollLength / screenWidth;
			const verticalScrollLength = screenHeight * ratio;

			document.body.style.height = `${verticalScrollLength}px`;
		}

		calcScrollView();

		window.addEventListener("resize", calcScrollView, {
			signal: controller.signal,
		});

		window.addEventListener(
			"scroll",
			(event) => {
				if (ref.current) {
					const screenWidth = window.innerWidth;
					const screenHeight = window.innerHeight;
					const ratio = screenWidth / screenHeight;

					ref.current.scrollLeft = window.scrollY * ratio;
				}
			},
			{ signal: controller.signal },
		);

		return () => {
			controller.abort();
		};
	}, [albumLength, landscapeLength, portraitLength]);

	return (
		<div
			ref={ref}
			className={cn(
				"h-screen w-screen fixed inset-0",
				"flex flex-row flex-nowrap overflow-hidden",
			)}
		>
			{children}
		</div>
	);
};
