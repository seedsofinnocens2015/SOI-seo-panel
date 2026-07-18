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
      <body className="flex h-dvh flex-col overflow-hidden bg-white">
        {children}
        <footer className="relative z-40 shrink-0 border-t border-[#b51f1f] bg-[#cc2727] px-2 py-1.5 text-center text-[11px] leading-snug text-white sm:px-3 sm:py-2 sm:text-[15px] sm:leading-tight">
          <p>© 2026 <Link href="https://www.seedsofinnocens.com/" className="font-bold text-white hover:text-white/80">Seeds Of Innocence IVF</Link>. All Rights Reserved. Designed &amp; Developed by <Link href="https://amit1999-portfolio.vercel.app/" className="border-b border-white/80 font-bold text-white hover:text-white/80">Amit Kumar</Link></p>
        </footer>
      </body>
    </html>
  );
}
