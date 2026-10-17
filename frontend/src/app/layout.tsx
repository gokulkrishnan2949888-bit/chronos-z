import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'CHRONOS-Z | High-Assurance Cyber-Banking & Coercion Interceptor',
  description: 'Next-generation IBM LinuxONE s390x powered cyber-banking gateway, real-time UPI coercion telemetry interceptor, and FIFO specific lien investigator war-room.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-bg text-cyber-textLight min-h-screen selection:bg-cyber-emerald selection:text-black">
        <div className="relative min-h-screen flex flex-col cyber-grid">
          {/* Subtle Cyber ambient glow in corners */}
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyber-emerald/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyber-crimson/5 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <Navigation />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          <footer className="border-t border-white/[0.06] bg-cyber-panelDark/90 py-4 px-6 text-center text-xs font-mono text-cyber-textMuted flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>IBM LinuxONE s390x Partition Enclave ID: #S390X-IND-MUMBAI-01</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Section 102 CrPC Granular Lien Compliance</span>
              <span className="text-white/20">|</span>
              <span className="text-cyber-emerald">FIFO Specific Lien Engine: ACTIVE</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
