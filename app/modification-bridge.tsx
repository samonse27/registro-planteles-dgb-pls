"use client";

import { useEffect } from "react";

export default function ModificationBridge() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const text = button.textContent?.toLowerCase() ?? "";
      if (!text.includes("solicitar modificación")) return;

      event.preventDefault();
      event.stopPropagation();
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      window.location.href = token ? `/modificar?token=${encodeURIComponent(token)}` : "/modificar";
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
