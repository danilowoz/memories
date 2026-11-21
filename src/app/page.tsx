"use client";

import { Desktop } from "@/components/desktop";
import { Mobile } from "@/components/mobile";
import { type Grouping, groupAlbums } from "@/lib/data";
import React from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

const subscribeToDesktopQuery = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export default function Home() {
  const [grouping, setGrouping] = React.useState<Grouping>("memory");
  const albums = React.useMemo(() => groupAlbums(grouping), [grouping]);
  const isDesktop = React.useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null,
  );

  if (isDesktop === null) return null;

  const View = isDesktop ? Desktop : Mobile;
  return (
    <View albums={albums} grouping={grouping} onGroupingChange={setGrouping} />
  );
}
