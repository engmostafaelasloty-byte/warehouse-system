import './globals.css';
import { Cairo, Inter } from 'next/font/google';
import { WarehouseProvider } from '@/components/WarehouseProvider';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Warehouse Management System | نظام إدارة المخازن',
  description: 'Multi-warehouse inventory management system | نظام متكامل لإدارة الوارد والصادر من المخازن',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" className={`${cairo.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <WarehouseProvider>
          {children}
        </WarehouseProvider>
      </body>
    </html>
  );
}
