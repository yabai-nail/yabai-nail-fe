import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AppProviders } from "./providers";
import "./globals.css";

const DEFAULT_LOCALE = "vi";
const DEFAULT_MESSAGES: Record<string, unknown> = {};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YABAI Nail Atelier",
  description: "Chăm sóc, thiết kế móng và đặt lịch tại YABAI.",
  applicationName: "YABAI Nail Atelier",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders locale={DEFAULT_LOCALE} messages={DEFAULT_MESSAGES}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
