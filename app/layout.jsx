import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'SOI Panel: Seeds of Innocence',
  description: 'Role-based SEO and HR admin panel for Seeds of Innocence',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-white">
        {children}
        <footer className="shrink-0 border-t border-zinc-200 bg-white px-3 py-2 text-center text-[13px] leading-tight text-zinc-500">
          <p>© 2026 Seeds Of Innocence IVF. All Rights Reserved. Designed &amp; Developed by <Link href="https://amit1999-portfolio.vercel.app/">Amit Kumar</Link></p>
        </footer>
      </body>
    </html>
  );
}
