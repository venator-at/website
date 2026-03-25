"use client";

import { useState, useEffect } from "react";

export function useProgress() {
  const [readDocs, setReadDocs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("venator-read-docs");
      if (stored) {
        setReadDocs(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Could not read progress from local storage", error);
    }
    setIsLoaded(true);
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("venator-read-docs", JSON.stringify(readDocs));
      } catch (error) {
        console.warn("Could not save progress to local storage", error);
      }
    }
  }, [readDocs, isLoaded]);

  const toggleRead = (slug: string) => {
    setReadDocs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  };

  const isRead = (slug: string) => readDocs.includes(slug);

  return {
    readDocs,
    toggleRead,
    isRead,
    isLoaded,
  };
}
