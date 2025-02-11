import config from "@payload-config";
import { getPayload } from "payload";

export default async function Home() {
	const payload = await getPayload({ config });
	const { docs: data } = await payload.find({
		collection: "album",
	});

	return (
		<div>
			{data.map((item) => {
				return <p key={item.id}>{item.name}</p>;
			})}
		</div>
	);
}
