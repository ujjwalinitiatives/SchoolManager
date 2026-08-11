"use client";
import { useEffect } from "react";
import { markAllNotificationsAsRead } from "./actions";

export function MarkReadTrigger() {
  useEffect(() => {
    markAllNotificationsAsRead();
  }, []);
  return null;
}
