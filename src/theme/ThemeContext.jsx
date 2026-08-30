import { createContext, useContext, useMemo, useEffect } from "react";
import { LIGHT, DARK } from "./colors";

const ThemeContext = createContext({ T: LIGHT, dark: false });

export function ThemeProvider({ dark, children }) {
  const T = dark ? DARK : LIGHT;
  const value = useMemo(() => ({ T, dark }), [T, dark]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(T).forEach(([key, val]) => {
      root.style.setProperty(`--db-${key}`, val);
    });
  }, [T]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
