"use client";

import { ThemeProvider } from "next-themes";

export function UserThemeProvider({ 
  userId, 
  children 
}: { 
  userId: string; 
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={`theme-${userId}`}
    >
      {children}
    </ThemeProvider>
  );
}
