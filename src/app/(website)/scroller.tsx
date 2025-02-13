"use client";

import React from "react";
import { cn } from "./utils";

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
			const screenWidth = document.body.clientWidth;

			let bodyHeight = 0;

			bodyHeight += albumLength * screenWidth;
			bodyHeight += portraitLength * (window.screen.height * 0.8 * 0.76);
			bodyHeight += landscapeLength * screenWidth;

			console.log(bodyHeight);

			document.body.style.height = `${bodyHeight}px`;
		}

		calcBodyHeight();

		window.addEventListener("resize", calcBodyHeight, {
			signal: controller.signal,
		});

		window.addEventListener(
			"scroll",
			(event) => {
				if (ref.current) {
					ref.current.scrollLeft = window.scrollY;
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
