import { cn } from "@/lib/classname";
import type { Grouping } from "@/lib/data";
import type { View } from "@/lib/engine";
import { ExpandIcon, GridIcon, LogoIcon } from "./icons";

const GROUPINGS: Grouping[] = ["memory", "year", "country"];

export const Toggle = ({
  view,
  onToggle,
}: { view: View; onToggle: () => void }) => {
  const icon = "absolute inset-0 m-auto transition duration-200 ease-out";
  const revealed =
    "scale-100 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100";
  const hidden = "scale-0 opacity-0";

  return (
    <div
      className={cn(
        "fade-in fixed z-50 bottom-5 left-4 p-2 rounded-full bg-white",
        "md:bottom-0 md:left-6 md:p-0 md:pb-5 md:rounded-none md:bg-transparent",
        view === "grid" && "max-md:hidden",
      )}
    >
      <span
        className={cn(
          "max-md:hidden absolute inset-0 bg-linear-to-b from-transparent to-white to-50%",
          view === "grid"
            ? "opacity-100 transition-opacity duration-300 delay-300"
            : "opacity-0",
        )}
      />
      <button
        type="button"
        aria-label={
          view === "grid" ? "Switch to list view" : "Switch to grid view"
        }
        onClick={onToggle}
        className="group relative block w-6 h-6 rounded cursor-pointer text-neutral-700 dark:text-neutral-400 transition-colors"
      >
        <ExpandIcon className={cn(icon, view === "grid" ? revealed : hidden)} />
        <GridIcon className={cn(icon, view === "list" ? revealed : hidden)} />
        <LogoIcon className="absolute inset-0 w-6 h-6 transition duration-200 ease-out group-hover:scale-70 group-hover:opacity-0 group-focus-visible:scale-70 group-focus-visible:opacity-0" />
      </button>
    </div>
  );
};

export const GroupingMenu = ({
  grouping,
  visible,
  onSelect,
}: {
  grouping: Grouping;
  visible: boolean;
  onSelect: (grouping: Grouping) => void;
}) => (
  <div
    inert={!visible}
    className={cn(
      "fixed z-30 flex gap-6 whitespace-nowrap transition-opacity duration-200",
      "bg-white bottom-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full",
      "md:bg-transparent md:bottom-[22px] md:left-20 md:translate-none md:p-0",
      visible ? "opacity-100" : "opacity-0",
    )}
  >
    {GROUPINGS.map((item) => (
      <button
        key={item}
        type="button"
        aria-pressed={grouping === item}
        onClick={() => onSelect(item)}
        className="text-neutral-400 text-sm cursor-pointer hover:text-neutral-900 transition-colors capitalize aria-pressed:text-neutral-900"
      >
        by {item}
      </button>
    ))}
  </div>
);
