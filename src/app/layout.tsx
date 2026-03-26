import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DX-RAY | Software Diagnostic Tool',
  description: 'Uncover hidden friction in your developer experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts for that pro look */}
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
