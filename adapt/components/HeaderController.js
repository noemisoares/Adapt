"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function HeaderController() {
  const pathname = usePathname();

  // Esconde o Header dentro de qualquer rota /dashboard
  const hideHeader = pathname.startsWith("/dashboard");

  if (hideHeader) return null;
  return <Header />;
}
