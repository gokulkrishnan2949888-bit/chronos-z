'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  PhoneCall, 
  PhoneOff, 
  Clipboard, 
  Clock, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Globe, 
  Sliders, 
  RotateCcw,
  Radio,
  Server,
  Zap,
  Cpu,
  Lock,
  Layers,
  Check
} from 'lucide-react';
import { 
  useBankingStore, 
  VERNACULAR_TRANSLATIONS, 
  SupportedLanguage 
} from '@/lib/store';
import { cyberSpring, cyberSpringBouncy, formatINR } from '@/lib/utils';
import { BACKEND_URL } from '@/lib/api';

export default function PayPage() {
  const router = useRouter();
  const {
    recipientVpa,
    recipientName,
    amount,
    activeCall,
    clipboardPasted,
    pastedContent,
    typingHesitationMs,
    deviceMotionVariance,
    riskScore,
    isWarningModalOpen,
    warningCountdown,
    selectedLanguage,
    paymentOutcome,
    liveBackendScore,
    isScoringBackend,
    backendUrl,
    setRecipientVpa,
    setAmount,
    toggleActiveCall,
    recordPaste,
    recordKeystroke,
    setDeviceMotionVariance,
    calculateRiskScore,
    triggerCoercionModal,
    closeCoercionModal,
    decrementWarningCountdown,
    setLanguage,
    executePayment,
    resetPayment,
    postPaymentTelemetryToBackend
  } = useBankingStore();

  const [callDurationSeconds, setCallDurationSeconds] = useState(148);
  const [showTelemetryInspector, setShowTelemetryInspector] = useState(true);
  const [manualTremor, setManualTremor] = useState(3.42);
  const [customVpa, setCustomVpa] = useState(recipientVpa);
  const [customAmount, setCustomAmount] = useState(amount.toString());
  const [isProcessing, setIsProcessing] = useState(false);

  // Active call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall) {
      timer = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  // Coercion warning 15-second countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWarningModalOpen && warningCountdown > 0) {
      interval = setInterval(() => {
        decrementWarningCountdown();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWarningModalOpen, warningCountdown, decrementWarningCountdown]);

  // Real DeviceMotionEvent listener with fallback to simulated tremor
  useEffect(() => {
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        const variance = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        const normalized = Math.min(10, Math.max(0.2, variance / 3));
        setDeviceMotionVariance(Number(normalized.toFixed(2)));
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [setDeviceMotionVariance]);

  // Recalculate score on mount
  useEffect(() => {
    calculateRiskScore();
  }, [calculateRiskScore]);

  // Handle Input typing and hesitation
  const handleVpaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomVpa(e.target.value);
    setRecipientVpa(e.target.value);
    recordKeystroke();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = Number(e.target.value.replace(/\D/g, '')) || 0;
    setCustomAmount(e.target.value);
    setAmount(numeric);
    recordKeystroke();
  };

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLInputElement>, fieldName: string) => {
    const text = e.clipboardData.getData('text');
    recordPaste(`[${fieldName}] ${text}`);
  };

  const handleManualTremorChange = (val: number) => {
    setManualTremor(val);
    setDeviceMotionVariance(val);
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const languages: { id: SupportedLanguage; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'hi', label: 'हिन्दी' },
    { id: 'ta', label: 'தமிழ்' },
    { id: 'te', label: 'తెలుగు' },
    { id: 'kn', label: 'ಕನ್ನಡ' },
    { id: 'bn', label: 'বাংলা' },
  ];

  const currentTranslation = VERNACULAR_TRANSLATIONS[selectedLanguage];

  const getRiskColor = (score: number) => {
    if (score >= 65) return 'text-cyber-crimson';
    if (score >= 35) return 'text-cyber-amber';
    return 'text-cyber-emerald';
  };

  const handlePayClick = async () => {
    setIsProcessing(true);
    await executePayment();
    setIsProcessing(false);
  };

  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto space-y-6">
      {/* Top Production Backend Connection Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cyber-panelDark border border-cyber-emerald/40 shadow-glow-emerald/10 font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-emerald"></span>
          </span>
          <span className="text-white font-bold">PRODUCTION BACKEND CONNECTED:</span>
          <span className="text-cyber-emerald truncate max-w-xs sm:max-w-md">
            {backendUrl}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
            API ROUTE: /score & /api/system
          </span>
        </div>
      </div>

      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyber-textMuted mb-1">
            <span>SECURE PAYMENT TERMINAL</span>
            <span>/</span>
            <span className="text-cyber-emerald font-semibold">UPI 2.0 PROTOCOL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
            Mobile-First Coercion Telemetry UPI
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTelemetryInspector(!showTelemetryInspector)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all ${
              showTelemetryInspector 
                ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan shadow-glow-cyan/20' 
                : 'bg-cyber-panel border-white/10 text-cyber-textMuted hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{showTelemetryInspector ? 'Hide Telemetry HUD' : 'Show Telemetry HUD'}</span>
          </button>

          <button
            onClick={resetPayment}
            className="px-3 py-1.5 rounded-lg bg-cyber-panel border border-white/10 text-xs font-mono text-cyber-textMuted hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ===================== MOBILE PHONE CONTAINER (Col 1-6) ===================== */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[40px] border-[6px] border-[#1E293B] bg-[#090D16] shadow-2xl overflow-hidden relative shadow-panel">
            {/* Phone Top Notch / Speaker Bar */}
            <div className="bg-[#111827] pt-3 pb-2 px-6 flex items-center justify-between text-[11px] font-mono text-white/70 border-b border-white/[0.06]">
              <span className="font-bold">18:15</span>
              <div className="w-20 h-4 bg-black rounded-full mx-auto -mt-1 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
              </div>
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>94%</span>
              </div>
            </div>

            {/* Simulated Active Call Banner */}
            <div className="relative">
              {activeCall ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={cyberSpring}
                  className="bg-cyber-crimson/95 text-white px-4 py-2.5 flex items-center justify-between shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <PhoneCall className="w-3 h-3 text-white" />
                    </span>
                    <div>
                      <div className="text-[11px] font-bold tracking-wide">ACTIVE CALL IN PROGRESS</div>
                      <div className="text-[10px] opacity-90 font-mono">
                        Unknown Caller (+91 91209...) • {formatCallTime(callDurationSeconds)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleActiveCall}
                    className="px-2 py-1 rounded bg-black/40 hover:bg-black/60 text-[10px] font-mono font-bold uppercase transition-colors"
                  >
                    Disconnect
                  </button>
                </motion.div>
              ) : (
                <div className="bg-cyber-panelDark/80 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-cyber-textMuted border-b border-white/[0.05]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <PhoneOff className="w-3 h-3" />
                    No Active Calls (Safe Baseline)
                  </span>
                  <button
                    onClick={toggleActiveCall}
                    className="text-cyber-crimson font-bold hover:underline"
                  >
                    + Simulate Call
                  </button>
                </div>
              )}
            </div>

            {/* UPI App Header */}
            <div className="p-4 bg-cyber-panel/40 border-b border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyber-emerald/20 border border-cyber-emerald/40 flex items-center justify-center text-cyber-emerald font-black font-mono text-sm">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono">CHRONOS PAY</h3>
                    <p className="text-[10px] text-cyber-textMuted">UPI ID: user@chronosbank</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ENC-L2</span>
                </div>
              </div>
            </div>

            {/* Payment Form inside Mobile Frame */}
            <div className="p-5 space-y-4">
              {/* Recipient Details */}
              <div>
                <label className="block text-[11px] font-mono text-cyber-textMuted mb-1.5 flex items-center justify-between">
                  <span>PAYING TO (UPI ID / VPA)</span>
                  {clipboardPasted && (
                    <span className="text-[10px] text-cyber-crimson font-bold flex items-center gap-0.5">
                      <Clipboard className="w-2.5 h-2.5" />
                      PASTE DETECTED
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customVpa}
                    onChange={handleVpaChange}
                    onPaste={(e) => handlePasteEvent(e, 'VPA')}
                    placeholder="recipient@upi"
                    className="w-full bg-cyber-panelDark border border-cyber-panelBorder rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-white/20 focus:outline-none focus:border-cyber-emerald transition-colors"
                  />
                  <div className="absolute right-2.5 top-2.5 text-[10px] font-mono text-cyber-emerald flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span>🏥 {recipientName}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[11px] font-mono text-cyber-textMuted mb-1.5 flex items-center justify-between">
                  <span>TRANSFER AMOUNT (INR)</span>
                  <span className="text-[10px] text-cyber-cyan font-mono">Instant Settlement</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-lg font-bold text-white/50">₹</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleAmountChange}
                    onPaste={(e) => handlePasteEvent(e, 'Amount')}
                    className="w-full bg-cyber-panelDark border border-cyber-panelBorder rounded-xl pl-8 pr-3 py-2 text-xl font-mono font-bold text-white focus:outline-none focus:border-cyber-emerald transition-colors"
                  />
                </div>

                {/* Quick amount presets */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {[5000, 25000, 48500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount(preset.toString());
                        recordKeystroke();
                      }}
                      className={`py-1 rounded-lg text-[10px] font-mono border transition-all ${
                        amount === preset
                          ? 'bg-cyber-emerald/20 border-cyber-emerald text-cyber-emerald font-bold'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Mini Biometric Risk Meter */}
              <div className="p-3 rounded-xl bg-cyber-panelDark border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyber-textMuted flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyber-cyan" />
                    Phone Risk Score:
                  </span>
                  <span className={`font-black text-sm ${getRiskColor(riskScore)}`}>
                    {riskScore}% {riskScore >= 65 ? 'CRITICAL RISK' : riskScore >= 35 ? 'ELEVATED' : 'LOW RISK'}
                  </span>
                </div>

                {/* Segmented risk progress bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
                  <motion.div
                    className={`h-full ${
                      riskScore >= 65 
                        ? 'bg-cyber-crimson shadow-glow-crimson' 
                        : riskScore >= 35 
                          ? 'bg-cyber-amber' 
                          : 'bg-cyber-emerald shadow-glow-emerald'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${riskScore}%` }}
                    transition={cyberSpring}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-cyber-textMuted pt-1">
                  <div>
                    Hesitation: <span className="text-white">{typingHesitationMs}ms</span>
                  </div>
                  <div>
                    Motion Tremor: <span className="text-white">{deviceMotionVariance} var</span>
                  </div>
                </div>
              </div>

              {/* Payment Outcome Message if Cleared */}
              {paymentOutcome === 'cleared' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={cyberSpring}
                  className="p-3 rounded-xl bg-cyber-emerald/15 border border-cyber-emerald text-cyber-emerald text-xs font-mono space-y-1"
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PAYMENT CLEARED: ₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[10px] text-cyber-textLight/80">
                    IBM LinuxONE s390x FIFO sub-ledger routed directly to Apollo Hospital account.
                  </div>
                </motion.div>
              )}

              {/* Pay Now Button (Posts telemetry to live backend) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={cyberSpring}
                onClick={handlePayClick}
                disabled={isProcessing || isScoringBackend}
                className={`w-full py-3.5 px-4 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  riskScore >= 65
                    ? 'bg-cyber-crimson hover:bg-red-500 text-white shadow-glow-crimson'
                    : 'bg-cyber-emerald hover:bg-emerald-400 text-black shadow-glow-emerald'
                }`}
              >
                {isProcessing || isScoringBackend ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin text-white" />
                    <span>POSTING TELEMETRY TO S390X BACKEND...</span>
                  </>
                ) : (
                  <>
                    <span>PAY ₹{amount.toLocaleString('en-IN')} VIA UPI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
              <p className="text-[10px] text-center font-mono text-cyber-textMuted">
                Protected by IBM LinuxONE s390x Live Scam Interceptor
              </p>
            </div>
          </div>
        </div>

        {/* ===================== INVESTIGATOR TELEMETRY HUD (Col 7-12) ===================== */}
        <div className="lg:col-span-6 space-y-5">
          {/* Signal Control Box (Simulate / Toggle signals easily) */}
          <div className="bg-cyber-panel rounded-2xl border border-cyber-panelBorder p-5 shadow-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyber-cyan" />
                <h3 className="text-sm font-mono font-bold text-white">
                  Behavioral Biometric Signal Generator
                </h3>
              </div>
              <button
                onClick={() => postPaymentTelemetryToBackend()}
                disabled={isScoringBackend}
                className="px-2.5 py-1 rounded bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald hover:bg-cyber-emerald/20 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
              >
                <Zap className="w-3 h-3" />
                <span>{isScoringBackend ? 'POSTING...' : '⚡ POST TO BACKEND /score'}</span>
              </button>
            </div>

            {/* Signal 1: Simulated Active Call Toggle */}
            <div className="p-3.5 rounded-xl bg-cyber-panelDark border border-white/[0.05] flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <PhoneCall className={`w-3.5 h-3.5 ${activeCall ? 'text-cyber-crimson animate-pulse' : 'text-cyber-textMuted'}`} />
                  <span>Signal 1: Active Voice Call Simulator</span>
                </div>
                <div className="text-[11px] text-cyber-textMuted mt-0.5">
                  Continuous call while initiating payment (+38 Risk)
                </div>
              </div>
              <button
                onClick={toggleActiveCall}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeCall
                    ? 'bg-cyber-crimson text-white shadow-glow-crimson/50'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {activeCall ? 'ON (COERCED)' : 'OFF (SAFE)'}
              </button>
            </div>

            {/* Signal 2: Clipboard Paste Listener */}
            <div className="p-3.5 rounded-xl bg-cyber-panelDark border border-white/[0.05] flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Clipboard className={`w-3.5 h-3.5 ${clipboardPasted ? 'text-cyber-crimson' : 'text-cyber-textMuted'}`} />
                  <span>Signal 2: Clipboard Paste Detector</span>
                </div>
                <div className="text-[11px] text-cyber-textMuted mt-0.5">
                  {clipboardPasted 
                    ? `Pasted content: "${pastedContent.slice(0, 24)}..." (+22 Risk)` 
                    : 'Paste VPA or amount to simulate external dictation (+22 Risk)'}
                </div>
              </div>
              <button
                onClick={() => recordPaste('[Simulated] apollo.emergency@icici')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  clipboardPasted
                    ? 'bg-cyber-crimson/20 border border-cyber-crimson text-cyber-crimson'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {clipboardPasted ? 'DETECTED' : 'Simulate Paste'}
              </button>
            </div>

            {/* Signal 3: Typing Hesitation Tracker */}
            <div className="p-3.5 rounded-xl bg-cyber-panelDark border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyber-amber" />
                  Signal 3: Typing Hesitation Tracker ({typingHesitationMs}ms)
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  typingHesitationMs > 750 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {typingHesitationMs > 750 ? '+20 RISK (PAUSE)' : 'NORMAL CADENCE'}
                </span>
              </div>
              <p className="text-[11px] text-cyber-textMuted">
                Real JS inter-keystroke interval calculation. Pauses &gt; 750ms flag user being coached or instructed word-by-word.
              </p>
            </div>

            {/* Signal 4: DeviceMotionEvent Variance (Tremor / Shaking) */}
            <div className="p-3.5 rounded-xl bg-cyber-panelDark border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
                  Signal 4: DeviceMotionEvent Variance ({deviceMotionVariance})
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  deviceMotionVariance > 2.0 ? 'bg-cyber-crimson/20 text-cyber-crimson' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {deviceMotionVariance > 2.0 ? '+15 RISK (TREMOR)' : 'STEADY GRIP'}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="8.0"
                step="0.1"
                value={manualTremor}
                onChange={(e) => handleManualTremorChange(parseFloat(e.target.value))}
                className="w-full accent-cyber-emerald cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-cyber-textMuted">
                <span>0.2 (Resting Table)</span>
                <span>3.4 (Stress Hand Tremor)</span>
                <span>8.0 (Violent Agitation)</span>
              </div>
            </div>
          </div>

          {/* LIVE BACKEND API TELEMETRY RESPONSE INSPECTOR */}
          {liveBackendScore && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={cyberSpring}
              className="p-5 rounded-2xl bg-cyber-panelDark border-2 border-cyber-cyan/50 shadow-glow-cyan/20 space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Server className="w-4 h-4 text-cyber-cyan" />
                  <span>LIVE S390X /score API TELEMETRY</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
                  {liveBackendScore.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-cyber-textMuted block">TRANSACTION ID</span>
                  <span className="text-white font-bold">{liveBackendScore.transaction_id}</span>
                </div>
                <div>
                  <span className="text-cyber-textMuted block">ACTION DECISION</span>
                  <span className="text-cyber-crimson font-bold">{liveBackendScore.action_decision}</span>
                </div>
                <div>
                  <span className="text-cyber-textMuted block">JOINT RISK SCORE</span>
                  <span className="text-cyber-crimson font-bold text-sm">
                    {(liveBackendScore.joint_risk_score * 100).toFixed(0)}% ({liveBackendScore.risk_tier})
                  </span>
                </div>
                <div>
                  <span className="text-cyber-textMuted block">LATENCY (SLA)</span>
                  <span className="text-cyber-emerald font-bold">
                    {liveBackendScore.telemetry.latency_microseconds} µs ({liveBackendScore.telemetry.acceleration_mode})
                  </span>
                </div>
              </div>

              {/* Bounded FIFO Lien Breakdown from Backend */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
                <div className="text-[11px] font-bold text-cyber-emerald flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bounded FIFO Specific Lien (Backend Calc)</span>
                </div>
                <div className="text-[10px] text-cyber-textLight/90 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/60">Formula:</span>
                    <span className="text-cyber-cyan font-bold">{liveBackendScore.bounded_fifo_lien.formula_applied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Calculated Hold:</span>
                    <span className="text-cyber-emerald font-bold">₹{liveBackendScore.bounded_fifo_lien.calculated_hold_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">SHA-256 Ledger Block:</span>
                    <span className="text-white font-mono truncate max-w-[180px]">{liveBackendScore.cryptographic_audit.ledger_block_hash}</span>
                  </div>
                </div>
              </div>

              {/* Explainability Top Reason Codes */}
              {liveBackendScore.explainability?.top3_reason_codes?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-cyber-textMuted font-bold uppercase">
                    Model Explainability (Top-3 Reason Codes):
                  </span>
                  <div className="space-y-1">
                    {liveBackendScore.explainability.top3_reason_codes.map((reason) => (
                      <div key={reason.rank} className="p-1.5 rounded bg-white/[0.03] text-[10px] flex items-center justify-between">
                        <span className="text-white">
                          #{reason.rank} {reason.reason_code}
                        </span>
                        <span className="text-cyber-textMuted text-[9px] truncate max-w-[160px]">
                          {reason.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Quick War-Room Link */}
          <div className="p-4 rounded-2xl bg-cyber-panelDark border border-cyber-panelBorder flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-white">Compare with Hospital Bill Slider?</div>
              <div className="text-[11px] font-mono text-cyber-textMuted">
                Inspect how IBM LinuxONE clears ₹48,500 vs Legacy Blanket Freeze.
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-xl bg-cyber-emerald text-black text-xs font-mono font-bold shadow-glow-emerald flex items-center gap-1.5 hover:bg-emerald-400 transition-all"
            >
              <span>War-Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 15-SECOND VERNACULAR COERCION WARNING MODAL ===================== */}
      <AnimatePresence>
        {isWarningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            {/* Fluid Sliding Modal with Framer Motion spring */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={cyberSpring}
              className="w-full max-w-2xl bg-cyber-panel rounded-t-3xl sm:rounded-3xl border-2 border-cyber-crimson shadow-glow-crimson p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Flashing Top Cyber Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyber-crimson via-amber-500 to-cyber-crimson animate-pulse" />

              {/* Close / Dismiss */}
              <button
                onClick={closeCoercionModal}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Language Selector Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap mb-5 pt-2">
                <span className="text-xs font-mono text-white/50 flex items-center gap-1 mr-2">
                  <Globe className="w-3.5 h-3.5 text-cyber-cyan" />
                  Language / भाषा:
                </span>
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                      selectedLanguage === lang.id
                        ? 'bg-cyber-emerald text-black font-bold shadow-glow-emerald/40'
                        : 'bg-white/5 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-cyber-crimson/20 border border-cyber-crimson text-cyber-crimson shrink-0 shadow-glow-crimson/30">
                    <ShieldAlert className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded bg-cyber-crimson/30 text-cyber-crimson text-[10px] font-mono font-bold border border-cyber-crimson/50 mb-1">
                      {currentTranslation.title}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                      {currentTranslation.subtitle}
                    </h2>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyber-crimson/10 border border-cyber-crimson/30 text-cyber-textLight text-sm leading-relaxed space-y-2">
                  <p className="font-semibold text-red-200">
                    {currentTranslation.warningText}
                  </p>
                  <p className="text-xs text-cyber-textMuted">
                    {currentTranslation.coercionPrompt}
                  </p>
                </div>

                {/* 15-Second Cooling Timer Badge */}
                <div className="p-3 rounded-xl bg-cyber-panelDark border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                    <div>
                      <div className="text-xs font-mono font-bold text-white">MANDATORY COGNITIVE COOLING PERIOD</div>
                      <div className="text-[11px] font-mono text-cyber-textMuted">
                        Preventing impulsive transfers during live social engineering
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-amber-400">
                      {warningCountdown}s
                    </span>
                  </div>
                </div>

                {/* Dual Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Action 1: Disconnect & Protect (Recommended) */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={cyberSpring}
                    onClick={() => {
                      if (activeCall) toggleActiveCall();
                      closeCoercionModal();
                    }}
                    className="py-3.5 px-4 rounded-xl bg-cyber-emerald hover:bg-emerald-400 text-black font-mono font-black text-xs flex items-center justify-center gap-2 shadow-glow-emerald transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{currentTranslation.cancelBtn}</span>
                  </motion.button>

                  {/* Action 2: Override (Locked until timer reaches 0) */}
                  <button
                    disabled={warningCountdown > 0}
                    onClick={() => {
                      closeCoercionModal();
                      executePayment();
                    }}
                    className={`py-3.5 px-4 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      warningCountdown > 0
                        ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-cyber-crimson hover:bg-red-500 text-white shadow-glow-crimson'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {warningCountdown > 0 
                        ? `Locked (${warningCountdown}s)` 
                        : currentTranslation.overrideBtn}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
