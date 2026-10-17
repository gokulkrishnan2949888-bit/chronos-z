import { create } from 'zustand';
import { 
  fetchHardwareVerification, 
  postScoreTransaction, 
  requestOtpFromBackend, 
  verifyOtpWithBackend,
  HardwareVerificationResponse,
  TransactionScoreResponse,
  BACKEND_URL 
} from './api';

export interface HospitalStep {
  step: number;
  title: string;
  category: string;
  amount: number;
  description: string;
  timestamp: string;
  legacyOutcome: {
    status: 'DECLINED' | 'CLEARED';
    badge: string;
    lienType: string;
    liquidBalance: number;
    frozenBalance: number;
    message: string;
    urgency: string;
  };
  chronosOutcome: {
    status: 'DECLINED' | 'CLEARED';
    badge: string;
    lienType: string;
    isolatedDisputeAmount: number;
    liquidBalance: number;
    clearedAmount: number;
    message: string;
    urgency: string;
    backendFormula?: string;
    blockHash?: string;
    latencyUs?: number;
    backendDoctrine?: string;
    cleanPortionCredited?: number;
    accountBalance?: string;
    auditLatestHash?: string;
  };
}

export const HOSPITAL_STEPS: HospitalStep[] = [
  {
    step: 1,
    title: 'Emergency Trauma Triage',
    category: 'Patient Intake & Stabilization',
    amount: 5000,
    description: 'Immediate trauma bay resuscitation, oxygen saturation monitoring, and preliminary blood profiling.',
    timestamp: '18:04:12 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Account frozen under Section 102 CrPC blanket cyber notice. Patient ICU admission refused.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 182500,
      clearedAmount: 5000,
      message: 'Transaction Cleared: IBM LinuxONE s390x isolated disputed ₹12,500 tranche into FIFO escrow. Hospital funds cleared.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 2,
    title: 'ICU Critical Bed Allocation',
    category: 'High-Dependency Unit',
    amount: 25000,
    description: 'Securing dedicated cardiac ICU bay, invasive arterial pressure line, and infusion pumps.',
    timestamp: '18:14:45 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Hospital billing terminal rejects UPI transaction. Account flagged in National Cybercrime Portal.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 162500,
      clearedAmount: 25000,
      message: 'Transaction Cleared: Specific lien protects medical disbursement. Unrelated complaint does not impede ICU bed assignment.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 3,
    title: 'Cardiac Catheterization & Stenting',
    category: 'Interventional Cardiology',
    amount: 50000,
    description: 'Urgent fluoroscopic coronary angiogram with drug-eluting stent deployment to clear LAD artery occlusion.',
    timestamp: '18:32:10 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Blanket lien prevents stent requisition. Cath-lab procedure stalled awaiting cash guarantor.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 137500,
      clearedAmount: 50000,
      message: 'Transaction Cleared: Real-time FIFO allocation preserves liquid collateral. Stent delivered to surgeon immediately.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 4,
    title: 'Critical Thrombolytic Infusion',
    category: 'Emergency Pharmacology',
    amount: 75000,
    description: 'Tenecteplase dosage and heparin continuous infusion protocol under electrophysiology telemetry.',
    timestamp: '18:48:22 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Automated fraud firewall halts pharmacy debit. 100% debit freeze enforced across all accounts.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 112500,
      clearedAmount: 75000,
      message: 'Transaction Cleared: IBM LinuxONE Crypto Express verifies legitimate hospital merchant VPA. Medicine dispensed without delay.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 5,
    title: 'Emergency Coronary Bypass Setup',
    category: 'Surgical Theater Preparation',
    amount: 115000,
    description: 'Extracorporeal perfusion circuit calibration, cardiothoracic surgeon mobilization, and blood bank cross-match.',
    timestamp: '19:05:30 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Entire family savings collateralized in error. Hospital demands physical demand draft.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 72500,
      clearedAmount: 115000,
      message: 'Transaction Cleared: Granular FIFO quarantine protects genuine life-saving transaction while keeping LEA interest ring-fenced.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 6,
    title: 'Surgical Suite Post-Op Care',
    category: 'Cardiothoracic Recovery',
    amount: 145000,
    description: 'Continuous hemodynamic monitoring, mechanical circulatory support standby, and arterial blood gas analysis.',
    timestamp: '19:22:15 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Zero funds accessible. Blanket cyber freeze leaves zero recourse during surgical convalescence.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 42500,
      clearedAmount: 145000,
      message: 'Transaction Cleared: ₹42,500 collateral cushion maintained. No collateral destruction for hospital or patient.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 7,
    title: 'Multi-Specialist Intensive Consult',
    category: 'Neuro-Cardio Critical Evaluation',
    amount: 165000,
    description: 'Dual neurologist and interventional electrophysiologist bedside consult with cerebral Doppler ultrasonography.',
    timestamp: '19:41:00 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Banking grievance ticket opened with 14-day SLA. Hospital administration issues payment default notice.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 22500,
      clearedAmount: 165000,
      message: 'Transaction Cleared: CHRONOS-Z sub-second settlement resolves liquidity bottleneck. 0 minutes lost in administrative delay.',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
  {
    step: 8,
    title: 'Final Clearance & Discharge Care',
    category: 'Discharge Settlement & Rehabilitation',
    amount: 185000,
    description: 'Final multi-department reconciliation, discharge medication supply, and portable telemetry kit issuance.',
    timestamp: '20:00:00 IST',
    legacyOutcome: {
      status: 'DECLINED',
      badge: 'BLANKET FREEZE',
      lienType: 'Total Account Freeze (100%)',
      liquidBalance: 0,
      frozenBalance: 200000,
      message: 'Transaction Failed: Entire ₹2,00,000 remains locked. High Court writ petition required to de-freeze medical funds.',
      urgency: 'CRITICAL HAZARD',
    },
    chronosOutcome: {
      status: 'CLEARED',
      badge: 'CHRONOS-Z FIFO SPECIFIC LIEN',
      lienType: 'Cryptographic Delta Lien (Sub-Ledger)',
      isolatedDisputeAmount: 12500,
      liquidBalance: 2500,
      clearedAmount: 185000,
      message: 'Transaction Cleared: ₹1,85,000 total medical disbursement successfully delivered. Collateral Liquidity Saved: ₹48,500!',
      urgency: 'OPTIMAL CLEARANCE',
      backendFormula: 'Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)',
    },
  },
];

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'bn';

export interface VernacularWarningContent {
  title: string;
  subtitle: string;
  warningText: string;
  coercionPrompt: string;
  cancelBtn: string;
  overrideBtn: string;
}

export const VERNACULAR_TRANSLATIONS: Record<SupportedLanguage, VernacularWarningContent> = {
  en: {
    title: 'CRITICAL COERCION WARNING',
    subtitle: 'High-Probability Social Engineering Intercepted',
    warningText: 'Our behavioral AI detected an active voice call combined with clipboard paste and abnormal hesitation. Are you currently speaking with someone instructing you to send this money?',
    coercionPrompt: 'Fraudsters impersonating Police, CBI, or Customs force victims onto continuous calls to bypass rational judgment. CHRONOS-Z will quarantine your account if you proceed under coercion.',
    cancelBtn: 'DISCONNECT & PROTECT FUNDS',
    overrideBtn: 'I am safe (Hold for timer)',
  },
  hi: {
    title: 'अति-महत्वपूर्ण जबरदस्ती और धोखाधड़ी चेतावनी',
    subtitle: 'संदेहास्पद कॉल और सामाजिक हेरफेर का पता चला',
    warningText: 'हमारे सिस्टम ने सक्रिय फोन कॉल, क्लिपबोर्ड पेस्ट और टाइपिंग में असामान्य हिचकिचाहट पकड़ी है। क्या कोई व्यक्ति कॉल पर आपको यह पैसे भेजने के लिए मजबूर कर रहा है?',
    coercionPrompt: 'पुलिस, सीबीआई या कस्टम अधिकारी बनकर ठग पीड़ितों को कॉल पर रखते हैं ताकि वे सोच न सकें। जबरदस्ती में पैसे न भेजें, यह तुरंत साइबर फ्रॉड हो सकता है।',
    cancelBtn: 'कॉल काटें और पैसे सुरक्षित रखें',
    overrideBtn: 'मैं सुरक्षित हूँ (टाइमर की प्रतीक्षा करें)',
  },
  ta: {
    title: 'முக்கிய அச்சுறுத்தல் மற்றும் மோசடி எச்சரிக்கை',
    subtitle: 'செயலில் உள்ள அழைப்பு மற்றும் வற்புறுத்தல் கண்டறியப்பட்டது',
    warningText: 'செயலில் உள்ள அழைப்பின் போது அவசரப் பரிவர்த்தனை, நகல் எடுக்கப்பட்ட விவரங்கள் மற்றும் தட்டச்சு தயக்கம் கண்டறியப்பட்டுள்ளது. யாராவது உங்களை கட்டாயப்படுத்துகிறார்களா?',
    coercionPrompt: 'காவல்துறை அல்லது அரசு அதிகாரிகள் போல் பேசி ஏமாற்றுபவர்கள் தொடர்ந்து அழைப்பில் வைத்து பணம் பறிக்கிறார்கள். உடனடியாக அழைப்பைத் துண்டிக்கவும்.',
    cancelBtn: 'அழைப்பைத் துண்டித்து பணத்தைப் பாதுகாக்கவும்',
    overrideBtn: 'நான் பாதுகாப்பாக இருக்கிறேன்',
  },
  te: {
    title: 'కీలకమైన మోసం మరియు బలవంతపు హెచ్చరిక',
    subtitle: 'యాక్టివ్ కాల్ మరియు మోసపూరిత ఒత్తిడి గుర్తించబడింది',
    warningText: 'యాక్టివ్ ఫోన్ కాల్, క్లిప్‌బోర్డ్ పేస్ట్ మరియు అసాధారణ టైపింగ్ సంకోచం గుర్తించబడ్డాయి. ఎవరైనా మిమ్మల్ని బెదిరించి డబ్బులు పంపమని బలవంతం చేస్తున్నారా?',
    coercionPrompt: 'పోలీసులు లేదా సీబీఐ అధికారులమని చెప్పి సైబర్ నేరగాళ్ళు బాధితులను ఫోన్ కాల్‌లో ఉంచి డబ్బులు లాక్కుంటారు. మోసపోకండి.',
    cancelBtn: 'కాల్ కట్ చేసి డబ్బును రక్షించండి',
    overrideBtn: 'నేను సురక్షితంగా ఉన్నాను',
  },
  kn: {
    title: 'ಗಂಭೀರ ಒತ್ತಡ ಮತ್ತು ವಂಚನೆ ಎಚ್ಚರಿಕೆ',
    subtitle: 'ಸಕ್ರಿಯ ಕರೆ ಮತ್ತು ಬೆದರಿಕೆಯ ವರ್ತನೆ ಪತ್ತೆಯಾಗಿದೆ',
    warningText: 'ಸಕ್ರಿಯ ಫೋನ್ ಕರೆ, ಕ್ಲಿಪ್‌ಬೋರ್ಡ್ ಪೇಸ್ಟ್ ಮತ್ತು ಟೈಪಿಂಗ್ ಹಿಂಜರಿಕೆಯನ್ನು ನಮ್ಮ ವ್ಯವಸ್ಥೆ ಪತ್ತೆ ಮಾಡಿದೆ. ಯಾರಾದರೂ ನಿಮಗೆ ಹಣ ವರ್ಗಾಯಿಸಲು ಒತ್ತಾಯಿಸುತ್ತಿದ್ದಾರೆಯೇ?',
    coercionPrompt: 'ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ಅಧಿಕಾರಿಗಳೆಂದು ಹೇಳಿಕೊಂಡು ವಂಚಕರು ಕರೆ ಮಾಡಿ ಹಣ ಕದಿಯುತ್ತಾರೆ. ತಕ್ಷಣ ಕರೆಯನ್ನು ಕಡಿತಗೊಳಿಸಿ.',
    cancelBtn: 'ಕರೆ ಕಡಿತಗೊಳಿಸಿ ಹಣ ರಕ್ಷಿಸಿ',
    overrideBtn: 'ನಾನು ಸುರಕ್ಷಿತವಾಗಿದ್ದೇನೆ',
  },
  bn: {
    title: 'গুরুত্বপূর্ণ ব্ল্যাকমেইল ও প্রতারণা সতর্কতা',
    subtitle: 'সক্রিয় ফোন কল এবং মানসিক চাপের লক্ষণ সনাক্ত হয়েছে',
    warningText: 'আমাদের এআই সিস্টেম চলমান ফোন কল, ক্লিপবোর্ড পেস্ট এবং টাইপিংয়ে অস্বাভাবিক দ্বিধা শনাক্ত করেছে। কেউ কি আপনাকে এই টাকা পাঠানোর জন্য চাপ দিচ্ছে?',
    coercionPrompt: 'পুলিশ বা সিবিআই সেজে সাইবার প্রতারকরা ভুক্তভোগীদের একটানা কলে রেখে টাকা হস্তগত করে। এখনই কল কেটে আপনার টাকা বাঁচান।',
    cancelBtn: 'কল কাটুন এবং টাকা সুরক্ষিত রাখুন',
    overrideBtn: 'আমি নিরাপদ (টাইমারের অপেক্ষা করুন)',
  },
};

interface BankingState {
  // Production Backend URL
  backendUrl: string;

  // Auth
  isAuthenticated: boolean;
  userPhone: string;
  userEmail: string;
  userName: string;
  otpSent: boolean;
  otpCountdown: number;
  otpCode: string[];
  demoOtpCode: string;

  // UPI Payment & Biometric Telemetry
  recipientVpa: string;
  recipientName: string;
  amount: number;
  isCustomAmount: boolean;
  activeCall: boolean;
  clipboardPasted: boolean;
  pastedContent: string;
  keystrokeTimestamps: number[];
  typingHesitationMs: number;
  deviceMotionVariance: number;
  riskScore: number;
  isWarningModalOpen: boolean;
  warningCountdown: number;
  selectedLanguage: SupportedLanguage;
  paymentOutcome: 'idle' | 'cleared' | 'blocked';

  // Live Backend Telemetry & Scoring
  isScoringBackend: boolean;
  liveBackendScore: TransactionScoreResponse | null;
  hardwareVerification: HardwareVerificationResponse | null;

  // Signature Component (8-Step Hospital Bill Slider)
  hospitalStepIndex: number;
  hospitalStepsData: HospitalStep[];
  isStepScoringLoading: boolean;

  // Dashboard War-Room
  collateralLiquiditySaved: number;
  targetCls: number;
  ibmEnclaveVerified: boolean;
  hardwareSerial: string;

  // Actions
  loginWithGoogle: () => void;
  sendOtp: (phone: string) => Promise<void>;
  decrementOtpCountdown: () => void;
  setOtpDigit: (index: number, digit: string) => void;
  verifyOtp: () => Promise<boolean>;
  logout: () => void;

  setRecipientVpa: (vpa: string, name?: string) => void;
  setAmount: (amount: number) => void;
  toggleActiveCall: () => void;
  recordPaste: (content: string) => void;
  recordKeystroke: () => void;
  setDeviceMotionVariance: (val: number) => void;
  calculateRiskScore: () => number;
  triggerCoercionModal: () => void;
  closeCoercionModal: () => void;
  decrementWarningCountdown: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  executePayment: () => Promise<void>;
  resetPayment: () => void;

  // Live Backend API Hooks
  fetchHardwareStatus: () => Promise<void>;
  postPaymentTelemetryToBackend: () => Promise<TransactionScoreResponse | null>;
  setHospitalStep: (step: number) => void;
  fetchLiveStepScore: (stepIdx: number) => Promise<void>;
  incrementHospitalStep: () => void;
  decrementHospitalStep: () => void;
}

export const useBankingStore = create<BankingState>((set, get) => ({
  backendUrl: BACKEND_URL,

  // Initial Auth
  isAuthenticated: true,
  userPhone: '+91 98765 43210',
  userEmail: 'investigator.arjun@chronos-bank.in',
  userName: 'Arjun V. Rao (Principal Cyber-Investigator)',
  otpSent: false,
  otpCountdown: 60,
  otpCode: ['', '', '', '', '', ''],
  demoOtpCode: '925320',

  // Initial UPI
  recipientVpa: 'apollo.trauma.emergency@icici',
  recipientName: 'Apollo Hospitals - Trauma Emergency Care',
  amount: 48500,
  isCustomAmount: false,
  activeCall: true,
  clipboardPasted: false,
  pastedContent: '',
  keystrokeTimestamps: [],
  typingHesitationMs: 940,
  deviceMotionVariance: 3.42,
  riskScore: 78,
  isWarningModalOpen: false,
  warningCountdown: 15,
  selectedLanguage: 'en',
  paymentOutcome: 'idle',

  // Live Backend State
  isScoringBackend: false,
  liveBackendScore: null,
  hardwareVerification: null,

  // Hospital Slider
  hospitalStepIndex: 2,
  hospitalStepsData: [...HOSPITAL_STEPS],
  isStepScoringLoading: false,

  // Dashboard
  collateralLiquiditySaved: 0,
  targetCls: 48500,
  ibmEnclaveVerified: true,
  hardwareSerial: 's390x-crypto-0x9F4E-enclave-8S',

  // Actions
  loginWithGoogle: () => {
    set({
      isAuthenticated: true,
      userName: 'Investigator Arjun (Google Verified)',
      userEmail: 'arjun.investigator@gmail.com',
      userPhone: '+91 98401 22910',
    });
  },

  sendOtp: async (phone: string) => {
    set({
      otpSent: true,
      otpCountdown: 60,
      userPhone: phone,
      otpCode: ['', '', '', '', '', ''],
    });

    try {
      const data = await requestOtpFromBackend(phone);
      if (data && data.demo_otp_code) {
        set({ demoOtpCode: String(data.demo_otp_code) });
      }
    } catch (err) {
      console.warn('Backend OTP request fallback:', err);
    }
  },

  decrementOtpCountdown: () => {
    const { otpCountdown } = get();
    if (otpCountdown > 0) {
      set({ otpCountdown: otpCountdown - 1 });
    }
  },

  setOtpDigit: (index: number, digit: string) => {
    const { otpCode } = get();
    const newCode = [...otpCode];
    newCode[index] = digit;
    set({ otpCode: newCode });
  },

  verifyOtp: async () => {
    const { otpCode, userPhone, demoOtpCode } = get();
    const code = otpCode.join('') || demoOtpCode;

    try {
      const res = await verifyOtpWithBackend(userPhone, code);
      if (res && res.status === 'AUTHENTICATED') {
        set({ isAuthenticated: true });
        return true;
      }
    } catch (err) {
      console.warn('Backend OTP verify fallback:', err);
    }

    if (code.length === 6) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chronos_access_token');
    }
    set({ isAuthenticated: false, otpSent: false });
  },

  setRecipientVpa: (vpa: string, name?: string) => {
    set({
      recipientVpa: vpa,
      recipientName: name || 'Emergency Medical Recipient',
    });
    get().calculateRiskScore();
  },

  setAmount: (amount: number) => {
    set({ amount });
    get().calculateRiskScore();
  },

  toggleActiveCall: () => {
    const nextCall = !get().activeCall;
    set({ activeCall: nextCall });
    get().calculateRiskScore();
  },

  recordPaste: (content: string) => {
    set({
      clipboardPasted: true,
      pastedContent: content,
    });
    get().calculateRiskScore();
  },

  recordKeystroke: () => {
    const now = Date.now();
    const { keystrokeTimestamps } = get();
    let hesitation = get().typingHesitationMs;

    if (keystrokeTimestamps.length > 0) {
      const lastKey = keystrokeTimestamps[keystrokeTimestamps.length - 1];
      const delta = now - lastKey;
      hesitation = Math.min(Math.max(delta, 120), 2400);
    }

    set({
      keystrokeTimestamps: [...keystrokeTimestamps.slice(-15), now],
      typingHesitationMs: hesitation,
    });
    get().calculateRiskScore();
  },

  setDeviceMotionVariance: (val: number) => {
    set({ deviceMotionVariance: val });
    get().calculateRiskScore();
  },

  calculateRiskScore: () => {
    const state = get();
    let score = 15;

    if (state.activeCall) score += 38;
    if (state.clipboardPasted) score += 22;
    if (state.typingHesitationMs > 750) {
      score += Math.min(22, Math.round((state.typingHesitationMs / 1200) * 20));
    }
    if (state.deviceMotionVariance > 2.0) {
      score += Math.min(15, Math.round(state.deviceMotionVariance * 3));
    }
    if (state.amount >= 40000) score += 5;

    const finalScore = Math.min(99, Math.max(8, score));
    set({ riskScore: finalScore });
    return finalScore;
  },

  triggerCoercionModal: () => {
    set({
      isWarningModalOpen: true,
      warningCountdown: 15,
      paymentOutcome: 'idle',
    });
  },

  closeCoercionModal: () => {
    set({ isWarningModalOpen: false });
  },

  decrementWarningCountdown: () => {
    const { warningCountdown } = get();
    if (warningCountdown > 0) {
      set({ warningCountdown: warningCountdown - 1 });
    }
  },

  setLanguage: (lang: SupportedLanguage) => {
    set({ selectedLanguage: lang });
  },

  // Post payment telemetry directly to live backend https://italiano-making-penetration-tampa.trycloudflare.com/score
  postPaymentTelemetryToBackend: async () => {
    const state = get();
    set({ isScoringBackend: true });

    // Calculate normalized behavioral biometric deviation (0.0 to 1.0)
    let biometricDev = 0.2;
    if (state.activeCall) biometricDev += 0.35;
    if (state.clipboardPasted) biometricDev += 0.2;
    if (state.typingHesitationMs > 750) biometricDev += 0.15;
    if (state.deviceMotionVariance > 2.0) biometricDev += 0.1;
    biometricDev = Math.min(0.99, Math.max(0.05, biometricDev));

    const payload = {
      transaction_id: `TXN-${Date.now().toString().slice(-8)}`,
      source_account_id: 'ACC-PATIENT-7788',
      destination_account_id: state.recipientVpa,
      transfer_amount: state.amount,
      remaining_unfrozen_taint: 12500.0,
      features: {
        txn_amount: state.amount,
        velocity_1h: state.activeCall ? 4.0 : 1.0,
        velocity_24h: 3.0,
        dormancy_ratio: 0.25,
        burst_fan_out: 0.1,
        rapid_drain_speed: state.clipboardPasted ? 0.85 : 0.2,
        geo_distance_km: 14.5,
        device_switch_count: 0.0,
        new_payee_flag: state.clipboardPasted ? 1.0 : 0.0,
        mule_graph_centrality: 0.05,
        network_hop_count: 1.0,
        odd_hour_flag: 0.0,
        ip_risk_score: 0.15,
        behavioral_biometric_dev: biometricDev,
        balance_drain_ratio: Math.min(0.95, state.amount / 200000),
        historical_fraud_incident: 0.0,
      },
    };

    try {
      const response = await postScoreTransaction(payload);
      if (response) {
        set({
          liveBackendScore: response,
          isScoringBackend: false,
          riskScore: Math.round(response.joint_risk_score * 100),
        });
        return response;
      }
    } catch (err) {
      console.error('Error posting telemetry to backend:', err);
    }

    set({ isScoringBackend: false });
    return null;
  },

  executePayment: async () => {
    const score = get().calculateRiskScore();
    // Fire live backend scoring
    const backendRes = await get().postPaymentTelemetryToBackend();

    if ((score >= 65 || (backendRes && backendRes.joint_risk_score >= 0.65)) && !get().isWarningModalOpen) {
      get().triggerCoercionModal();
      return;
    }

    set({
      paymentOutcome: 'cleared',
      isWarningModalOpen: false,
    });
  },

  resetPayment: () => {
    set({
      clipboardPasted: false,
      pastedContent: '',
      paymentOutcome: 'idle',
      isWarningModalOpen: false,
      warningCountdown: 15,
      liveBackendScore: null,
    });
    get().calculateRiskScore();
  },

  // Fetch live hardware status from https://italiano-making-penetration-tampa.trycloudflare.com/api/system/hardware-verify
  fetchHardwareStatus: async () => {
    const data = await fetchHardwareVerification();
    if (data) {
      set({
        hardwareVerification: data,
        ibmEnclaveVerified: true,
        hardwareSerial: `${data.host_information.platform_machine}-${data.s390x_architecture_verification.compiler_target || '0x9F4E'}`,
      });
    }
  },

  setHospitalStep: (step: number) => {
    const clamped = Math.max(0, Math.min(7, step));
    set({ hospitalStepIndex: clamped });
    get().fetchLiveStepScore(clamped);
  },

  // Fetch live API score for a Hospital Step and update the slider widget dynamically!
  fetchLiveStepScore: async (stepIdx: number) => {
    const steps = [...get().hospitalStepsData];
    const targetStep = steps[stepIdx];
    if (!targetStep) return;

    set({ isStepScoringLoading: true });

    const payload = {
      transaction_id: `TXN-HOSP-STEP-0${targetStep.step}`,
      source_account_id: 'ACC-PATIENT-7788',
      destination_account_id: 'ACC-APOLLO-HOSPITAL-991',
      transfer_amount: targetStep.amount,
      remaining_unfrozen_taint: 12500.0,
      features: {
        txn_amount: targetStep.amount,
        velocity_1h: 1.0,
        velocity_24h: 3.0,
        dormancy_ratio: 0.15,
        burst_fan_out: 0.05,
        rapid_drain_speed: 0.1,
        geo_distance_km: 8.0,
        device_switch_count: 0.0,
        new_payee_flag: 0.0,
        mule_graph_centrality: 0.02,
        network_hop_count: 1.0,
        odd_hour_flag: 0.0,
        ip_risk_score: 0.08,
        behavioral_biometric_dev: 0.12,
        balance_drain_ratio: Math.min(0.95, targetStep.amount / 200000),
        historical_fraud_incident: 0.0,
      },
    };

    try {
      const res = await postScoreTransaction(payload);
      if (res && res.bounded_fifo_lien) {
        const holdAmount = res.bounded_fifo_lien.calculated_hold_amount > 0 
          ? res.bounded_fifo_lien.calculated_hold_amount 
          : (res.bounded_fifo_lien.original_remaining_taint ?? 12500);
        const totalCollateral = 200000;
        const cleanCredited = res.bounded_fifo_lien.clean_portion_credited ?? targetStep.amount;
        const liquidRemaining = Math.max(0, totalCollateral - holdAmount - targetStep.amount);

        steps[stepIdx] = {
          ...targetStep,
          chronosOutcome: {
            ...targetStep.chronosOutcome,
            isolatedDisputeAmount: holdAmount,
            liquidBalance: liquidRemaining,
            clearedAmount: cleanCredited,
            message: `Transaction Cleared via IBM LinuxONE s390x (${res.telemetry.latency_microseconds}µs). Doctrine: ${res.bounded_fifo_lien.statutory_doctrine || "Rule in Clayton's Case (1816)"}. Formula: "${res.bounded_fifo_lien.formula_applied}". Hash: ${res.cryptographic_audit.ledger_block_hash.slice(0, 16)}...`,
            backendFormula: res.bounded_fifo_lien.formula_applied,
            blockHash: res.cryptographic_audit.ledger_block_hash,
            latencyUs: res.telemetry.latency_microseconds,
            backendDoctrine: res.bounded_fifo_lien.statutory_doctrine,
            cleanPortionCredited: cleanCredited,
            accountBalance: res.account_ledger_snapshot?.clean_available_balance,
            auditLatestHash: res.cryptographic_audit.audit_chain_latest_hash,
          },
        };

        set({
          hospitalStepsData: steps,
          isStepScoringLoading: false,
          targetCls: Math.max(48500, cleanCredited),
        });
        return;
      }
    } catch (err) {
      console.error('Error fetching step score:', err);
    }

    set({ isStepScoringLoading: false });
  },

  incrementHospitalStep: () => {
    const { hospitalStepIndex } = get();
    if (hospitalStepIndex < 7) {
      get().setHospitalStep(hospitalStepIndex + 1);
    }
  },

  decrementHospitalStep: () => {
    const { hospitalStepIndex } = get();
    if (hospitalStepIndex > 0) {
      get().setHospitalStep(hospitalStepIndex - 1);
    }
  },
}));
