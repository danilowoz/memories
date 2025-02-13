import config from "@payload-config";
import { getPayload } from "payload";
import "./globals.css";
import React from "react";
import { Scroller } from "./scroller";

export default async function Home() {
	const payload = await getPayload({ config });
	const { docs: album } = await payload.find({
		collection: "album",
		where: { enabled: { equals: true } },
	});

	const { docs: allMedia } = await payload.find({
		collection: "media",
		where: { enabled: { equals: true } },
	});

	const mediaMetaData = allMedia.reduce(
		(acc, item) => {
			if (item.width > item.height) {
				acc.landscape += 1;
			} else {
				acc.portrait += 1;
			}
			return acc;
		},
		{ portrait: 0, landscape: 0 },
	);

	return (
		<Scroller
			albumLength={album.length}
			portraitLength={mediaMetaData.portrait}
			landscapeLength={mediaMetaData.landscape}
		>
			{album.map((item) => {
				return <Album key={item.id} id={item.id} />;
			})}
		</Scroller>
	);
}

const Album = async ({ id }: { id: string | number }) => {
	const payload = await getPayload({ config });
	const { docs: media } = await payload.find({
		collection: "media",
		where: { album: { equals: id }, enabled: { equals: true } },
	});

	const album = await payload.findByID({
		collection: "album",
		id: id,
	});

	return (
		<>
			<div className="item min-w-screen min-h-screen flex">
				<h2 className="m-auto">{album.name}</h2>
			</div>

			{media.map((item) => (
				<figure key={item.id} className="flex">
					<div className="m-auto px-[40px]">
						{item.url && (
							<img className="h-[80vh] max-w-none" src={item.url} alt="" />
						)}

						<figcaption>
							<p>{item.location}</p>
							<small>{item.date}</small>
						</figcaption>
					</div>
				</figure>
			))}
		</>
	);
};
