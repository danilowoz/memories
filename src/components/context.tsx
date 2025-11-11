"use client";

import { MotionValue, useMotionValue } from "motion/react";
import React from "react";

export const context = React.createContext<{
  scrollX: MotionValue<number>;
  windowWidth: number;
  layout: "list" | "grid";
  clickedId: string;
  setClickedId: React.Dispatch<React.SetStateAction<string>>;
  setLayout: React.Dispatch<React.SetStateAction<"list" | "grid">>;
  enableDarkMode: boolean;
  setEnableDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  scrollX: new MotionValue(0),
  windowWidth: 0,
  layout: "grid",
  clickedId: "",
  setClickedId: () => {},
  setLayout: () => {},
  enableDarkMode: false,
  setEnableDarkMode: () => {},
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const scrollX = useMotionValue(0);
  const [windowWidth, setWindowWidth] = React.useState(0);
  const [layout, setLayout] = React.useState<"list" | "grid">("grid");
  const [clickedId, setClickedId] = React.useState<string>("");
  const [enableDarkMode, setEnableDarkMode] = React.useState(false);

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
    <context.Provider
      value={{
        scrollX,
        windowWidth,
        layout,
        clickedId,
        setClickedId,
        setLayout,
        enableDarkMode,
        setEnableDarkMode,
      }}
    >
      {children}
    </context.Provider>
  );
};
