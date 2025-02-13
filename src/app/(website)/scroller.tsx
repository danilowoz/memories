"use client";

import React from "react";
import { cn } from "./utils";

const LANDSCAPE_RATIO = 1.5;
const PORTRAIT_RATIO = 0.66;
const PADDING_RATIO = 0.8;

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

	React.useLayoutEffect(() => {
		const controller = new AbortController();

		function calcBodyHeight() {
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;

			let horizontalScroll = 0;

			const heightWithRatio = (screenHeight + 120) * PADDING_RATIO;
			horizontalScroll += albumLength * screenWidth;
			horizontalScroll += portraitLength * (heightWithRatio * PORTRAIT_RATIO);
			horizontalScroll += landscapeLength * (heightWithRatio * LANDSCAPE_RATIO);

			const ratio = horizontalScroll / screenWidth;

			document.body.style.height = `${screenHeight * ratio}px`;
		}

		calcBodyHeight();

		window.addEventListener("resize", calcBodyHeight, {
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
				"flex flex-row flex-nowrap overflow-x-auto",
			)}
		>
			{children}
		</div>
	);
};
