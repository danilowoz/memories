"use client";

import { MotionValue, useMotionValue } from "framer-motion";
import React from "react";

export const context = React.createContext<{
  scrollX: MotionValue<number>;
  windowWidth: number;
  layout: "list" | "grid";
  setLayout: React.Dispatch<React.SetStateAction<"list" | "grid">>;
}>({
  scrollX: new MotionValue(0),
  windowWidth: 0,
  layout: "list",
  setLayout: () => {},
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const scrollX = useMotionValue(0);
  const [windowWidth, setWindowWidth] = React.useState(0);
  const [layout, setLayout] = React.useState<"list" | "grid">("list");

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (layout === "grid") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
    }
  }, [layout]);

  return (
    <context.Provider value={{ scrollX, windowWidth, layout, setLayout }}>
      {children}
    </context.Provider>
  );
};
