import type { CollectionConfig } from "payload";

export const Album: CollectionConfig = {
	slug: "album",
	admin: {
		useAsTitle: "name",
	},
	fields: [
		{ name: "name", type: "text", required: true, admin: {} },
		{ name: "dark", type: "checkbox" },
	],
};
