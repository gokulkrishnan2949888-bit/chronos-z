'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Smartphone, 
  Activity, 
  Server, 
  Cpu, 
  Lock, 
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useBankingStore } from '@/lib/store';
import { cyberSpring } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();
  const { 
    ibmEnclaveVerified, 
    riskScore, 
    activeCall, 
    isAuthenticated,
    userPhone 
  } = useBankingStore();

  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toTimeString().split(' ')[0] + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/login', label: '01. GATEWAY', icon: Lock, badge: isAuthenticated ? 'AUTH' : 'LOCKED' },
    { href: '/pay', label: '02. UPI TERMINAL', icon: Smartphone, badge: `${riskScore}% RISK` },
    { href: '/dashboard', label: '03. WAR-ROOM', icon: Activity, badge: 's390x ENCLAVE' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-panelBorder/60 bg-[#090D16]/90 backdrop-blur-md">
      {/* Top micro status ticker */}
      <div className="flex h-7 items-center justify-between px-4 border-b border-white/[0.04] bg-cyber-panelDark/80 text-[11px] font-mono text-cyber-textMuted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyber-emerald font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-emerald"></span>
            </span>
            CHRONOS-Z HIGH-ASSURANCE CORE
          </span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="hidden sm:flex items-center gap-1 text-cyber-cyan">
            <Cpu className="w-3 h-3" />
            IBM LinuxONE s390x ENCLAVE (Crypto Express 8S)
          </span>
          <span className="hidden md:inline text-white/30">|</span>
          <span className="hidden md:flex items-center gap-1">
            <Server className="w-3 h-3 text-emerald-400" />
            LATENCY: 0.38ms (MUMBAI L1)
          </span>
        </div>

        <div className="flex items-center gap-4">
          {activeCall && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyber-crimson/20 border border-cyber-crimson/40 text-cyber-crimson text-[10px] font-bold animate-pulse">
              <Radio className="w-2.5 h-2.5" />
              SIMULATED CALL ACTIVE (+38 RISK)
            </span>
          )}
          <span className="font-mono text-cyber-textLight/70">{timeString || '18:15:00 IST'}</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-lg bg-cyber-panel border border-cyber-emerald/40 flex items-center justify-center shadow-glow-emerald/30 group-hover:border-cyber-emerald transition-colors">
            <ShieldCheck className="w-5 h-5 text-cyber-emerald transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyber-emerald border-2 border-[#090D16]"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg tracking-wider text-white">CHRONOS<span className="text-cyber-emerald">-Z</span></span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                v2.4 s390x
              </span>
            </div>
            <p className="text-[11px] text-cyber-textMuted -mt-0.5">FIFO Coercion & Liquidity Interceptor</p>
          </div>
        </Link>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-cyber-panel/80 p-1.5 rounded-xl border border-white/[0.08]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 sm:px-4 py-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    transition={cyberSpring}
                    className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.15] shadow-inner"
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-cyber-emerald' : 'text-cyber-textMuted'}`} />
                <span className={`relative z-10 ${isActive ? 'text-white font-bold' : 'text-cyber-textMuted hover:text-white'}`}>
                  {link.label}
                </span>
                <span className={`relative z-10 hidden md:inline text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isActive 
                    ? 'bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/30' 
                    : 'bg-white/[0.04] text-white/40'
                }`}>
                  {link.badge}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Info Badge */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono font-medium text-white flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {userPhone}
            </div>
            <div className="text-[10px] text-cyber-textMuted font-mono">
              Role: Principal UI/UX Investigator
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="px-2.5 py-1 rounded bg-cyber-panel border border-cyber-panelBorder text-[11px] font-mono text-cyber-emerald flex items-center gap-1.5 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-cyber-emerald" />
            <span>s390x-0x9F4E</span>
          </div>
        </div>
      </div>
    </header>
  );
}
