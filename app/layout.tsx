import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata = {
  title: "NeedBridge",
  description: "Volunteer coordination system for NGOs and social impact groups."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-8">
            <header className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-ink px-6 py-5 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <Link href="/" className="font-display text-3xl font-semibold tracking-tight">
                  NeedBridge
                </Link>
                <p className="mt-1 text-sm text-white/70">
                  Data-driven community response for NGOs and volunteer networks.
                </p>
              </div>
              <nav className="flex flex-wrap items-center gap-3 text-sm">
                <Link href="/" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">Map</Link>
                <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">Dashboard</Link>
                <Link href="/report" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">Report Need</Link>
                <Link href="/upload" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">Upload Survey</Link>
                <Link href="/volunteer/register" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">Volunteer</Link>
                <AuthNav />
              </nav>
            </header>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
