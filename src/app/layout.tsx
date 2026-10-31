import type { Metadata } from "next";
import { Bricolage_Grotesque, Atkinson_Hyperlegible } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "700", "800"] });
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Spider Ludo prototype",
  description: "Clickable prototype of the Spider team's educational Ludo game.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${atkinson.variable} felt min-h-full`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
