import type { CSSProperties } from "react";

export const CoverTitle = ({
  name,
  animated,
}: { name: string; animated: boolean }) => {
  if (!name.includes("Memories")) {
    return <div className="opacity-40">{name}</div>;
  }

  const memoriesFirst = name.indexOf("Memories") === 0;
  const rest = name.replace("Memories", "");
  const memories = <div className="opacity-60">Memories</div>;

  return (
    <>
      {memoriesFirst && memories}
      <div className="letters text-white opacity-20 whitespace-pre">
        {animated
          ? rest.split("").map((char, index, chars) => (
              <span
                key={`${char}${index}`}
                className="letter"
                style={{ "--i": index, "--n": chars.length } as CSSProperties}
              >
                {char}
              </span>
            ))
          : rest}
      </div>
      {!memoriesFirst && memories}
    </>
  );
};
