import type { Metadata } from 'next';
import { Providers } from '@/providers';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Trendora - Shop Quality Products',
  description: 'Discover amazing products at Trendora. Shop the latest trends with quality and style.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
