"use client";

import type { Memories } from "@/utils/types";

export const Timeline = ({ payload }: { payload: Memories }) => {
  console.log(payload);
  return (
    <div className="fixed left-0 right-0 bottom-0 m-4 flex flex-row gap-4">
      {payload.map((item) => (
        <div className="bg-red-500 flex-1 h-2" key={item.id} />
      ))}
    </div>
  );
};
