import React from "react";

export function useIsSafari(): boolean {
  const [isSafari, setIsSafari] = React.useState(false);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined" || !window.navigator) {
      setIsSafari(true);
      return;
    }

    const userAgent = window.navigator.userAgent;

    setIsSafari(
      userAgent.includes("Safari") &&
        !userAgent.includes("Chrome") &&
        !userAgent.includes("Chromium") &&
        !userAgent.includes("Edge"),
    );
  }, []);

  return isSafari;
}
