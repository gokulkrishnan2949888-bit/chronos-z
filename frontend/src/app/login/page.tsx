'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Terminal, 
  Sparkles,
  Fingerprint,
  Cpu,
  Check,
  Server
} from 'lucide-react';
import { useBankingStore } from '@/lib/store';
import { cyberSpring, cyberSpringBouncy } from '@/lib/utils';
import { BACKEND_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { 
    isAuthenticated, 
    loginWithGoogle, 
    sendOtp, 
    decrementOtpCountdown, 
    otpCountdown, 
    verifyOtp,
    userPhone,
    demoOtpCode,
    backendUrl
  } = useBankingStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [activeDigit, setActiveDigit] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        decrementOtpCountdown();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpCountdown, decrementOtpCountdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMsg('');
    await sendOtp(`+91 ${phoneNumber}`);
    setStep('otp');
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveDigit(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveDigit(index - 1);
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleVerifySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setErrorMsg('');

    const verified = await verifyOtp();
    if (verified) {
      setIsVerifying(false);
      setStep('success');
      setTimeout(() => {
        router.push('/pay');
      }, 1000);
    } else {
      setIsVerifying(false);
      setErrorMsg('Invalid or expired OTP. Please check the code.');
    }
  };

  const handleGoogleAuth = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      loginWithGoogle();
      setGoogleLoading(false);
      setStep('success');
      setTimeout(() => {
        router.push('/pay');
      }, 1000);
    }, 800);
  };

  const autofillDemoOtp = () => {
    const code = demoOtpCode || '925320';
    setDigits(code.split('').slice(0, 6));
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Top Production Backend Connection Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cyber-panelDark border border-cyber-emerald/40 shadow-glow-emerald/10 font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-emerald"></span>
          </span>
          <span className="text-white font-bold">AUTH BACKEND CONNECTED:</span>
          <span className="text-cyber-emerald truncate max-w-xs sm:max-w-md">
            {backendUrl}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
            HMAC-SHA256 OTP API
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cyberSpring}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-panel border border-cyber-emerald/30 text-cyber-emerald text-xs font-mono mb-3 shadow-glow-emerald/20">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>ZERO-COERCION GATEWAY // IBM LINUXONE S390X HSM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
          Secure Identity Gateway
        </h1>
        <p className="mt-2 text-sm text-cyber-textMuted max-w-md mx-auto font-sans">
          Hardware-enforced biometric authentication with real-time coercion interception and granular sub-ledger protection.
        </p>
      </motion.div>

      {/* Main Auth Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Auth Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={cyberSpring}
          className="lg:col-span-7 bg-cyber-panel rounded-2xl border border-cyber-panelBorder p-6 sm:p-8 shadow-panel relative overflow-hidden"
        >
          {/* Subtle top neon hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-emerald to-transparent" />

          {/* Step 1: Google OAuth Button */}
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={cyberSpring}
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              className="w-full relative flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-[#111827] border border-white/10 hover:border-cyber-emerald/60 hover:bg-[#162235] text-white font-mono text-sm transition-all shadow-sm group"
            >
              {googleLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-cyber-emerald" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-semibold">Sign in with Google OAuth</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/30 ml-auto hidden sm:inline">
                Instant SSO
              </span>
            </motion.button>

            {/* Cyber Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/[0.08]"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-cyber-textMuted uppercase bg-cyber-panel px-2">
                OR PHONE + BIOMETRIC OTP
              </span>
              <div className="flex-grow border-t border-white/[0.08]"></div>
            </div>

            {/* Form Transitions with Framer Motion spring physics */}
            <AnimatePresence mode="wait">
              {step === 'phone' && (
                <motion.form
                  key="phone-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={cyberSpring}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-mono text-cyber-textMuted mb-2">
                      PHONE NUMBER (INDIA KYC ENROLLED)
                    </label>
                    <div className="flex rounded-xl bg-cyber-panelDark border border-cyber-panelBorder focus-within:border-cyber-emerald focus-within:ring-1 focus-within:ring-cyber-emerald transition-all overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3.5 bg-white/[0.03] border-r border-white/[0.08] text-xs font-mono text-cyber-textLight">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full bg-transparent px-4 py-3 text-sm font-mono text-white placeholder-white/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-cyber-textMuted">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Carrier Security: Airtel/Jio 5G SIM Verified
                    </span>
                    <span>Backend HMAC-SHA256</span>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-mono text-cyber-crimson">{errorMsg}</p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={cyberSpring}
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-cyber-emerald hover:bg-emerald-400 text-black font-mono font-bold text-sm shadow-glow-emerald transition-all"
                  >
                    <span>REQUEST 60-SEC OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.form>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={cyberSpring}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-mono text-white font-semibold">ENTER 6-DIGIT OTP</h3>
                      <p className="text-xs text-cyber-textMuted font-mono">
                        Sent to <span className="text-white">+91 {phoneNumber}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs font-mono text-cyber-emerald hover:underline"
                    >
                      Change Number
                    </button>
                  </div>

                  {/* 6 Digit Input boxes */}
                  <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePasteOtp}>
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-12 h-14 text-center text-xl font-mono font-bold rounded-xl border bg-cyber-panelDark text-white focus:outline-none transition-all ${
                          digit
                            ? 'border-cyber-emerald shadow-glow-emerald/40 text-cyber-emerald'
                            : 'border-cyber-panelBorder hover:border-white/30 focus:border-cyber-emerald'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-cyber-textMuted">OTP Expiry:</span>
                      <span className={`font-bold ${otpCountdown > 10 ? 'text-cyber-emerald' : 'text-cyber-crimson animate-pulse'}`}>
                        {String(Math.floor(otpCountdown / 60)).padStart(2, '0')}:
                        {String(otpCountdown % 60).padStart(2, '0')}s
                      </span>
                    </div>

                    {otpCountdown === 0 ? (
                      <button
                        type="button"
                        onClick={() => sendOtp(`+91 ${phoneNumber}`)}
                        className="flex items-center gap-1 text-cyber-emerald hover:underline font-bold"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        RESEND OTP NOW
                      </button>
                    ) : (
                      <span className="text-cyber-textMuted text-[11px]">
                        Resend active after timer
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={autofillDemoOtp}
                      className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 text-cyber-cyan hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-cyber-cyan" />
                      <span>⚡ Auto-fill Backend OTP ({demoOtpCode || '925320'})</span>
                    </button>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-mono text-cyber-crimson">{errorMsg}</p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={cyberSpring}
                    onClick={() => handleVerifySubmit()}
                    disabled={isVerifying}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-cyber-emerald hover:bg-emerald-400 text-black font-mono font-bold text-sm shadow-glow-emerald transition-all"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>VERIFYING S390X SIGNATURE...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>VERIFY & ACCESS ENCLAVE</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={cyberSpringBouncy}
                  className="py-8 text-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-full bg-cyber-emerald/20 border border-cyber-emerald flex items-center justify-center mx-auto text-cyber-emerald shadow-glow-emerald">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white">AUTHENTICATION GRANTED</h3>
                  <p className="text-xs text-cyber-textMuted font-mono">
                    Token verified via Crypto Express 8S Hardware Enclave.
                  </p>
                  <p className="text-xs text-cyber-emerald font-mono animate-pulse">
                    Transferring to Biometric UPI Screen...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Side: Cyber Hardware Enclave Terminal & Specifications */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={cyberSpring}
          className="lg:col-span-5 space-y-4"
        >
          {/* Hardware Enclave Status Card */}
          <div className="bg-cyber-panelDark rounded-2xl border border-cyber-panelBorder p-5 font-mono text-xs space-y-4 shadow-panel">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white">
                <Cpu className="w-4 h-4 text-cyber-emerald" />
                <span className="font-bold">IBM LINUXONE s390x HSM</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
                SECURE 99.999%
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-cyber-textMuted">
              <div className="flex justify-between">
                <span>ENCLAVE PARTITION</span>
                <span className="text-cyber-textLight">LPAR-CRYPTO-Z</span>
              </div>
              <div className="flex justify-between">
                <span>CIPHER SUITE</span>
                <span className="text-cyber-cyan">CRYPTO EXPRESS 8S / AES-256</span>
              </div>
              <div className="flex justify-between">
                <span>COERCION INTERCEPTOR</span>
                <span className="text-cyber-emerald">ACTIVE [LIVE BACKEND]</span>
              </div>
              <div className="flex justify-between">
                <span>SECTION 102 CrPC ENGINE</span>
                <span className="text-cyber-textLight">FIFO GRANULAR LIEN</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
              <div className="flex items-center gap-2 text-cyber-textLight font-semibold text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-cyber-emerald" />
                <span>Live Auth Stream</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono leading-relaxed">
                <div>&gt; ATTEST: Enclave root verified ({backendUrl.slice(0, 28)}...)</div>
                <div>&gt; POLICY: SIM swap check = 0 days elapsed</div>
                <div>&gt; BIOMETRIC: Micro-hesitation tracking armed</div>
              </div>
            </div>
          </div>

          {/* Quick Flow Navigator */}
          <div className="p-4 rounded-xl bg-cyber-panel/60 border border-white/[0.07] flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-white font-medium">Ready to test Coercion Interception?</div>
              <div className="text-cyber-textMuted text-[11px]">Proceed directly to Mobile UPI Screen</div>
            </div>
            <button
              onClick={() => router.push('/pay')}
              className="px-3 py-1.5 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald hover:bg-cyber-emerald/20 transition-colors flex items-center gap-1 font-bold"
            >
              <span>Go to /pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
