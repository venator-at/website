import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Venator — AI Architecture Advisor",
  description: "From idea to perfect architecture in minutes. AI-powered tech stack recommendations for beginners and junior developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `(function(){try{var t=localStorage.getItem('venator-theme')||'dark';var a=localStorage.getItem('venator-accent')||'cyan';var h=document.documentElement;var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);h.classList.remove('dark','light');h.classList.add(d?'dark':'light');['accent-violet','accent-blue','accent-emerald','accent-rose','accent-orange','accent-cyan'].forEach(function(c){h.classList.remove(c)});h.classList.add('accent-'+a)}catch(e){}})();`;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} dark accent-cyan h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
        <span className="fixed bottom-2 right-3 z-50 font-mono text-[10px] text-white/20 select-none pointer-events-none">
          v{process.env.NEXT_PUBLIC_BUILD_VERSION}
        </span>
      </body>
    </html>
  );
}
