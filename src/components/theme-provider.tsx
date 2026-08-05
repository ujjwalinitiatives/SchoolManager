"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// @ts-ignore
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: any) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
