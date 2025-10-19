"use client";

import { MotionValue, useMotionValue } from "framer-motion";
import React from "react";

export const context = React.createContext<{
  scrollX: MotionValue<number>;
  windowWidth: number;
  layout: "horizontal" | "vertical";
  setLayout: React.Dispatch<React.SetStateAction<"horizontal" | "vertical">>;
}>({
  scrollX: new MotionValue(0),
  windowWidth: 0,
  layout: "horizontal",
  setLayout: () => {},
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const scrollX = useMotionValue(0);
  const [windowWidth, setWindowWidth] = React.useState(0);
  const [layout, setLayout] = React.useState<"horizontal" | "vertical">(
    "horizontal",
  );

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (layout === "vertical") {
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
