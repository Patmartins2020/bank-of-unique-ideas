import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Contact | Bank of Unique Ideas",
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}