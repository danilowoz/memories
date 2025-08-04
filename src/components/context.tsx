"use client";

import { MotionValue, useMotionValue } from "framer-motion";
import React from "react";

type Object = "image" | "Travel" | "By Her" | "Layers" | null;

export const context = React.createContext<{
  scrollX: MotionValue<number>;
  windowWidth: number;
  overObject: Object;
  setOverObject: React.Dispatch<React.SetStateAction<Object>>;
}>({
  scrollX: new MotionValue(0),
  windowWidth: 0,
  overObject: null,
  setOverObject: () => {},
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const scrollX = useMotionValue(0);
  const [windowWidth, setWindowWidth] = React.useState(0);
  const [overObject, setOverObject] = React.useState<"image" | null>(null);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <context.Provider
      value={{
        scrollX,
        windowWidth,
        overObject,
        setOverObject,
      }}
    >
      {children}
    </context.Provider>
  );
};
