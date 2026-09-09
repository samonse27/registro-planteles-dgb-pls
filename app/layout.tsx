import type { Metadata } from "next";
import "./globals.css";
import "./menu-scale.css";
import ConsultaFilterBridge from "./consulta-filter-bridge";
import ModificationBridge from "./modification-bridge";

export const metadata: Metadata = {
  title: "Gestión de Planteles PLS | DGB",
  description: "Portal para registrar y gestionar planteles PLS por estado.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased"><ConsultaFilterBridge /><ModificationBridge />{children}</body>
    </html>
  );
}
