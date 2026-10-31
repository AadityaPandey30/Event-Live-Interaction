import './globals.css';

export const metadata = {
  title: 'Catalygn Edge · Business Health Check',
  description:
    'A preliminary 9-question self-assessment of your sales, operations and finance systems, by Catalygn Edge.',
  robots: { index: false, follow: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12161d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased">{children}</body>
    </html>
  );
}
