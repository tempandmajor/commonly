import type { ReactNode } from "react";

export const metadata = {
  title: "Commonly",
  description: "The Pre Sale Event Ticketing Platform",
};

import "../src/index.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
