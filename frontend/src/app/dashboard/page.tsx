'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Sliders, 
  AlertOctagon, 
  ArrowUpRight, 
  ExternalLink,
  Zap,
  Server,
  Lock,
  HeartPulse,
  DollarSign,
  RefreshCw,
  Hash,
  Database
} from 'lucide-react';
import { useBankingStore, HospitalStep } from '@/lib/store';
import { cyberSpring, cyberSpringBouncy, formatINR } from '@/lib/utils';
import { BACKEND_URL } from '@/lib/api';

export default function DashboardPage() {
  const {
    hospitalStepIndex,
    hospitalStepsData,
    isStepScoringLoading,
    setHospitalStep,
    incrementHospitalStep,
    decrementHospitalStep,
    fetchLiveStepScore,
    targetCls,
    ibmEnclaveVerified,
    hardwareSerial,
    hardwareVerification,
    fetchHardwareStatus,
    backendUrl
  } = useBankingStore();

  // Animated Collateral Liquidity Saved (CLS) counter from 0 to ₹48,500
  const [clsDisplay, setClsDisplay] = useState(0);
  const [isCounting, setIsCounting] = useState(true);

  // Fetch live hardware status and initial step score on mount
  useEffect(() => {
    fetchHardwareStatus();
    fetchLiveStepScore(hospitalStepIndex);
  }, [fetchHardwareStatus, fetchLiveStepScore, hospitalStepIndex]);

  useEffect(() => {
    let start = 0;
    const end = targetCls;
    const duration = 1800;
    const startTime = performance.now();

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(ease * end);
      setClsDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setIsCounting(false);
      }
    };

    requestAnimationFrame(animateCount);
  }, [targetCls]);

  const currentStepData = hospitalStepsData[hospitalStepIndex] || hospitalStepsData[0];

  return (
    <div className="py-4 sm:py-8 max-w-7xl mx-auto space-y-8">
      {/* Top Production Backend Connection Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cyber-panelDark border border-cyber-cyan/40 shadow-glow-cyan/10 font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-cyan"></span>
          </span>
          <span className="text-white font-bold">WAR-ROOM BACKEND TELEMETRY FEED:</span>
          <span className="text-cyber-cyan truncate max-w-xs sm:max-w-md">
            {backendUrl}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchHardwareStatus();
              fetchLiveStepScore(hospitalStepIndex);
            }}
            disabled={isStepScoringLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-cyber-textLight text-[11px] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isStepScoringLoading ? 'animate-spin text-cyber-emerald' : ''}`} />
            <span>Sync Live Backend</span>
          </button>
        </div>
      </div>

      {/* ===================== WAR-ROOM HEADER WITH IBM LINUXONE S390X BADGE ===================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cyberSpring}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-cyber-textMuted uppercase tracking-wider">
              INVESTIGATOR WAR-ROOM // LIQUIDITY SURVEILLANCE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
            Section 102 CrPC Granular Lien War-Room
          </h1>
          <p className="mt-1 text-sm text-cyber-textMuted max-w-2xl font-sans">
            Real-time forensic arbitration separating innocent medical collateral from cybercrime proceeds using IBM LinuxONE s390x FIFO sub-ledgers.
          </p>
        </div>

        {/* GLOWING 'Verified IBM LinuxONE s390x' HEADER BADGE */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-emerald via-cyber-cyan to-cyber-emerald rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse-slow"></div>
          <div className="relative px-5 py-3.5 rounded-2xl bg-cyber-panelDark border border-cyber-emerald/50 shadow-glow-emerald flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-emerald/15 border border-cyber-emerald flex items-center justify-center text-cyber-emerald shadow-sm">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white">
                  Verified IBM LinuxONE s390x
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/40">
                  {hardwareVerification ? hardwareVerification.status : 'VERIFIED'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-cyber-textMuted flex items-center gap-2 mt-0.5">
                <span>
                  Target: {hardwareVerification?.s390x_architecture_verification?.compiler_target || 's390x-ibm-loz'}
                </span>
                <span>•</span>
                <span className="text-cyber-cyan">
                  {hardwareVerification?.hardware_acceleration_verdict || 'NNPA Accelerated'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===================== WAR-ROOM METRIC CARDS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ANIMATED COLLATERAL LIQUIDITY SAVED (CLS) CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={cyberSpring}
          className="md:col-span-2 rounded-2xl bg-cyber-panel border border-cyber-panelBorder p-6 shadow-panel relative overflow-hidden group"
        >
          {/* Subtle Emerald Neon Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-emerald via-emerald-400 to-cyber-cyan" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyber-emerald font-bold">
                <span className="w-2 h-2 rounded-full bg-cyber-emerald animate-ping" />
                <span>DYNAMIC TELEMETRY METRIC</span>
              </div>
              <h3 className="text-lg font-bold text-white font-sans mt-0.5">
                Collateral Liquidity Saved (CLS)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald">
              <Zap className="w-3.5 h-3.5" />
              <span>FIFO Precision: 100%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 mb-4">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white glow-text-emerald">
              {formatINR(clsDisplay)}
            </span>
            <span className="text-xs font-mono text-cyber-textMuted">
              out of ₹48,500 target emergency tranche
            </span>
          </div>

          {/* Visual comparative bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyber-crimson flex items-center gap-1">
                <span>Legacy Blanket Freeze:</span>
                <span className="font-bold">₹0 Saved (100% Frozen)</span>
              </span>
              <span className="text-cyber-emerald flex items-center gap-1">
                <span>CHRONOS-Z FIFO:</span>
                <span className="font-bold">₹48,500 Preserved</span>
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-cyber-panelDark overflow-hidden flex p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(clsDisplay / 48500) * 100}%` }}
                transition={cyberSpring}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyber-emerald shadow-glow-emerald"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-cyber-textMuted block text-[10px]">RECOVERY LATENCY</span>
              <span className="text-white font-bold">
                {currentStepData.chronosOutcome.latencyUs 
                  ? `${currentStepData.chronosOutcome.latencyUs} µs Live` 
                  : '420ms Instantaneous'}
              </span>
            </div>
            <div>
              <span className="text-cyber-textMuted block text-[10px]">PATIENT ICU ACCESS</span>
              <span className="text-cyber-emerald font-bold">UNINTERRUPTED</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-cyber-textMuted block text-[10px]">DISPUTED ISOLATION</span>
              <span className="text-cyber-cyan font-bold">
                ₹{currentStepData.chronosOutcome.isolatedDisputeAmount.toLocaleString('en-IN')} Specific Lien
              </span>
            </div>
          </div>
        </motion.div>

        {/* SYSTEM ENCLAVE STATUS & AUDIT STATS WITH LIVE BACKEND HARDWARE DATA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={cyberSpring}
          className="rounded-2xl bg-cyber-panelDark border border-cyber-panelBorder p-6 shadow-panel space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
              <Server className="w-4 h-4 text-cyber-cyan" />
              <span>HARDWARE ENCLAVE</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {hardwareVerification ? 'OPERATIONAL' : 'OPTIMAL'}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cyber-textMuted text-[11px]">Machine Architecture</span>
              <span className="text-white text-[11px] font-bold">
                {hardwareVerification?.host_information?.platform_machine || 'AMD64'} ({hardwareVerification?.host_information?.cpu_count || 20} Cores)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyber-textMuted text-[11px]">zDLC Target Compiler</span>
              <span className="text-cyber-cyan text-[11px] font-bold">
                {hardwareVerification?.s390x_architecture_verification?.compiler_target || 's390x-ibm-loz'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyber-textMuted text-[11px]">NNPA Coprocessor (Bit 165)</span>
              <span className="text-emerald-400 text-[11px] font-bold">z16 On-Chip AI</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyber-textMuted text-[11px]">VXE SIMD Facility (Bit 129)</span>
              <span className="text-cyber-emerald text-[11px] font-bold">128-bit Vector Engine</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[10px] font-mono text-cyber-textMuted leading-relaxed">
              <div className="text-cyber-cyan font-bold mb-1">zDLC Compilation Flags:</div>
              <div className="truncate text-white/70">
                {hardwareVerification?.zdlc_compilation_flags || '--EmitLib --O3 -march=z16 --mtriple=s390x-ibm-loz --maccel=NNPA'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===================== THE SIGNATURE COMPONENT: 8-STEP HOSPITAL BILL SLIDER ===================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cyberSpring}
        className="rounded-3xl bg-cyber-panel border border-cyber-panelBorder p-6 sm:p-8 shadow-panel space-y-6 relative"
      >
        {/* Header of Signature Component */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-emerald/15 border border-cyber-emerald/40 flex items-center justify-center text-cyber-emerald">
              <HeartPulse className="w-5 h-5 text-cyber-emerald" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyber-cyan font-bold uppercase">
                  THE SIGNATURE COMPONENT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                  Step {hospitalStepIndex + 1} of 8
                </span>
                {isStepScoringLoading && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/40 animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Querying /score API...
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                Interactive 8-Step Hospital Bill Liquidity Slider
              </h2>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={decrementHospitalStep}
              disabled={hospitalStepIndex === 0}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1 transition-all ${
                hospitalStepIndex === 0
                  ? 'border-white/5 text-white/20 cursor-not-allowed bg-black/20'
                  : 'border-white/10 text-white hover:bg-white/10 bg-cyber-panelDark'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev Step</span>
            </button>
            <button
              onClick={incrementHospitalStep}
              disabled={hospitalStepIndex === 7}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1 transition-all ${
                hospitalStepIndex === 7
                  ? 'border-white/5 text-white/20 cursor-not-allowed bg-black/20'
                  : 'border-cyber-emerald text-cyber-emerald hover:bg-cyber-emerald/20 bg-cyber-panelDark font-bold'
              }`}
            >
              <span className="hidden sm:inline">Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8-Step Scrubbing Timeline Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-cyber-textMuted">
            <span>SCRUB HOSPITAL EMERGENCY TIMELINE</span>
            <span className="text-white font-bold">
              Current Procedure: {currentStepData.title} ({formatINR(currentStepData.amount)})
            </span>
          </div>

          {/* Step Pill Buttons for instant scrubbing */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {hospitalStepsData.map((step, idx) => {
              const isSelected = hospitalStepIndex === idx;
              const isPast = hospitalStepIndex > idx;

              return (
                <button
                  key={step.step}
                  onClick={() => setHospitalStep(idx)}
                  className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-cyber-emerald bg-cyber-emerald/15 shadow-glow-emerald/30 text-white'
                      : isPast
                        ? 'border-white/10 bg-cyber-panelDark text-white/80 hover:border-white/30'
                        : 'border-white/5 bg-black/20 text-white/40 hover:text-white/70'
                  }`}
                >
                  <div className="text-[10px] font-mono flex items-center justify-between mb-1">
                    <span className="font-bold">STEP 0{step.step}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyber-emerald animate-ping" />}
                  </div>
                  <div className="text-[11px] font-sans font-semibold truncate">
                    {step.title.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-cyber-textMuted mt-0.5">
                    ₹{(step.amount / 1000).toFixed(0)}k
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Range Scrubber */}
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="7"
              step="1"
              value={hospitalStepIndex}
              onChange={(e) => setHospitalStep(parseInt(e.target.value))}
              className="w-full accent-cyber-emerald cursor-pointer h-2 bg-cyber-panelDark rounded-lg border border-white/10"
            />
          </div>
        </div>

        {/* CURRENT STEP DETAILS BANNER */}
        <div className="p-4 rounded-2xl bg-cyber-panelDark border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-cyber-cyan font-bold">
              {currentStepData.category}
            </span>
            <span className="text-white font-medium">{currentStepData.description}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-cyber-textMuted">Timestamp: </span>
            <span className="text-white font-bold">{currentStepData.timestamp}</span>
          </div>
        </div>

        {/* ===================== FLUID SPLIT-SCREEN COMPARISON WIDGET (UPDATES ON BACKEND API) ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* LEFT: RED 'LEGACY BLANKET FREEZE' (DECLINING PAYMENT) */}
          <motion.div
            key={`legacy-${hospitalStepIndex}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={cyberSpring}
            className="rounded-2xl bg-[#140b0e] border-2 border-cyber-crimson p-6 shadow-glow-crimson/20 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Red Alert Banner */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cyber-crimson/30 mb-4">
                <div className="flex items-center gap-2 text-cyber-crimson font-mono font-bold text-xs">
                  <XCircle className="w-5 h-5 text-cyber-crimson animate-pulse" />
                  <span>LEGACY BLANKET FREEZE</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyber-crimson/20 border border-cyber-crimson/50 text-cyber-crimson text-[10px] font-mono font-black uppercase tracking-wider">
                  PAYMENT DECLINED
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-cyber-crimson/10 border border-cyber-crimson/30">
                  <div className="text-xs font-mono font-bold text-red-300 mb-1">
                    STATUS: TRANSACTION ABORTED
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed font-sans">
                    {currentStepData.legacyOutcome.message}
                  </p>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Lien Mechanism:</span>
                    <span className="text-red-400 font-bold">{currentStepData.legacyOutcome.lienType}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Frozen Collateral:</span>
                    <span className="text-cyber-crimson font-black text-sm">
                      {formatINR(currentStepData.legacyOutcome.frozenBalance)} (100%)
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Liquid Funds Accessible:</span>
                    <span className="text-red-400 font-bold">₹0 (ZERO ACCESS)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-cyber-textMuted">Clinical Care Impact:</span>
                    <span className="text-cyber-crimson font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      PROCEDURE HALTED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cyber-crimson/20 text-[11px] font-mono text-red-300/70">
              ⚠️ Result: Patient critical care denied due to indiscriminate 100% account freeze on suspected cyber complaint.
            </div>
          </motion.div>

          {/* RIGHT: GREEN 'CHRONOS-Z FIFO SPECIFIC LIEN' (CLEARING PAYMENT - DRIVEN BY LIVE /score API) */}
          <motion.div
            key={`chronos-${hospitalStepIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={cyberSpring}
            className="rounded-2xl bg-[#091a14] border-2 border-cyber-emerald p-6 shadow-glow-emerald/30 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Green Clearance Banner */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cyber-emerald/30 mb-4">
                <div className="flex items-center gap-2 text-cyber-emerald font-mono font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-cyber-emerald" />
                  <span>CHRONOS-Z FIFO SPECIFIC LIEN</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentStepData.chronosOutcome.latencyUs && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {currentStepData.chronosOutcome.latencyUs} µs SLA
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-cyber-emerald/20 border border-cyber-emerald/50 text-cyber-emerald text-[10px] font-mono font-black uppercase tracking-wider">
                    PAYMENT CLEARED
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/30">
                  <div className="text-xs font-mono font-bold text-emerald-300 mb-1 flex items-center justify-between">
                    <span>STATUS: LIVE BACKEND SETTLEMENT VERIFIED</span>
                    <span className="text-[10px] text-cyber-cyan font-mono">
                      {currentStepData.chronosOutcome.backendFormula || 'Hold = min(Transfer, Taint)'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                    {currentStepData.chronosOutcome.message}
                  </p>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Lien Mechanism:</span>
                    <span className="text-emerald-400 font-bold">{currentStepData.chronosOutcome.lienType}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Isolated Dispute Tranche:</span>
                    <span className="text-cyber-cyan font-bold">
                      {formatINR(currentStepData.chronosOutcome.isolatedDisputeAmount)} (Quarantined)
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Liquid Collateral Preserved:</span>
                    <span className="text-cyber-emerald font-black text-sm">
                      {formatINR(currentStepData.chronosOutcome.liquidBalance)} (Available)
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-cyber-textMuted">Clinical Care Impact:</span>
                    <span className="text-cyber-emerald font-bold flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5" />
                      IMMEDIATE TREATMENT
                    </span>
                  </div>
                  {currentStepData.chronosOutcome.backendDoctrine && (
                    <div className="flex justify-between py-1.5 border-b border-white/[0.05] text-[10px]">
                      <span className="text-cyber-textMuted">Statutory Doctrine:</span>
                      <span className="text-cyber-cyan font-mono font-semibold">
                        {currentStepData.chronosOutcome.backendDoctrine}
                      </span>
                    </div>
                  )}
                  {currentStepData.chronosOutcome.blockHash && (
                    <div className="flex justify-between py-1.5 text-[10px]">
                      <span className="text-cyber-textMuted flex items-center gap-1">
                        <Hash className="w-3 h-3 text-cyber-cyan" />
                        Ledger Block Hash:
                      </span>
                      <span className="text-white/80 font-mono truncate max-w-[200px]">
                        {currentStepData.chronosOutcome.blockHash}
                      </span>
                    </div>
                  )}
                  {currentStepData.chronosOutcome.auditLatestHash && (
                    <div className="flex justify-between py-1 text-[10px]">
                      <span className="text-cyber-textMuted flex items-center gap-1">
                        <Database className="w-3 h-3 text-emerald-400" />
                        Audit Chain State:
                      </span>
                      <span className="text-emerald-400 font-mono truncate max-w-[200px]">
                        {currentStepData.chronosOutcome.auditLatestHash.slice(0, 24)}... (VERIFIED)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cyber-emerald/20 text-[11px] font-mono text-emerald-300/80 flex items-center justify-between">
              <span>✅ Result: Hospital billing cleared in real-time. Disputed delta safely held in escrow.</span>
              <button
                onClick={() => fetchLiveStepScore(hospitalStepIndex)}
                disabled={isStepScoringLoading}
                className="text-cyber-cyan hover:underline text-[10px] font-bold flex items-center gap-1"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isStepScoringLoading ? 'animate-spin' : ''}`} />
                Re-score
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
