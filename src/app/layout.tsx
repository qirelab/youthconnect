// Root layout - handles non-locale routes (API, etc.)
// The main app is rendered through [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
