"use client";

import { MotionValue, useMotionValue } from "framer-motion";
import React from "react";

export const context = React.createContext<{
  scrollX: MotionValue<number>;
  windowWidth: number;
}>({
  scrollX: new MotionValue(0),
  windowWidth: 0,
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const scrollX = useMotionValue(0);
  const [windowWidth, setWindowWidth] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <context.Provider value={{ scrollX, windowWidth }}>
      {children}
    </context.Provider>
  );
};
