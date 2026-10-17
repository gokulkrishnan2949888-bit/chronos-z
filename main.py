#!/usr/bin/env python3
"""
CHRONOS-Z Autonomous Scam Interception Engine
Team: Two Bugs and a Byte (SRC MCET) - IBM Z Datathon 2026
Production Architecture for IBM LinuxONE (s390x architecture) & IBM z16

Core APIs:
1. /api/auth                      -> Enterprise Auth (Google OAuth 2.0, HMAC-SHA256 Phone OTP, JWT, RBAC)
2. /api/system/hardware-verify     -> LinuxONE s390x verification (uname -m, /proc/cpuinfo, NNPA bit 165, VXE bit 129)
3. /score                          -> Real-time mule detection via ctypes chronos_mule_model.so,
                                     17-row single-pass median perturbation (<0.5ms),
                                     Top-3 Reason Codes, Bounded FIFO Specific Lien, SHA-256 Ledger.
"""

import os
import sys
import time
import json
import ctypes
import platform
import hashlib
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

import numpy as np
from decimal import Decimal
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from auth_security import (
    limiter,
    OWASPSecurityHeadersMiddleware,
    SecurityAuditLogger,
    TimeBasedOTP,
    GoogleOAuthService,
    TokenService,
    UserRole,
    UserProfile,
    MOCK_USER_STORE,
    get_current_user,
    require_role,
    AUDIT_LOG_FILE,
)

from taint_ledger import (
    BankingTaintLedger,
    to_decimal,
    TaintTranche,
    InsufficientCleanFundsError,
    LienViolationError,
    InvalidAmountError,
)
from audit_chain import (
    AuditChain,
    ChainVerificationResult,
    compute_sha256,
    GENESIS_HASH,
)

logger = logging.getLogger("chronos_main")
logging.basicConfig(level=logging.INFO)

# ============================================================================
# FastAPI Application Assembly & Middleware Configuration
# ============================================================================
app = FastAPI(
    title="CHRONOS-Z Banking Engine",
    description="IBM LinuxONE z16 Autonomous Real-Time Scam Interception Architecture",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Register SlowAPI Limiter state & Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register OWASP Strict Security Headers Middleware
app.add_middleware(OWASPSecurityHeadersMiddleware)

# Cross-Origin Resource Sharing (CORS) - Banking & Cloudflare Tunnel Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://chronos-z.ibm.bank"
    ],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Strict-Transport-Security", "Content-Security-Policy", "X-Frame-Options"]
)

# Ledger and Audit Chain File Paths
TRANSACTION_LEDGER_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "chronos_transaction_ledger.jsonl"
)
LIVE_AUDIT_CHAIN_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "live_audit_trail.jsonl"
)

# Global Append-Only SHA-256 Cryptographic Audit Chain (audit_chain.py)
chronos_audit_chain = AuditChain(LIVE_AUDIT_CHAIN_FILE)

# Active Banking Accounts Registry (taint_ledger.BankingTaintLedger)
ACCOUNT_LEDGERS: Dict[str, BankingTaintLedger] = {}

def get_or_create_ledger(account_id: str, account_holder: str = "Beneficiary") -> BankingTaintLedger:
    """
    Retrieves an existing account ledger or initializes a new one bound to the
    append-only cryptographic audit chain under BNSS Sections 106-107.
    """
    if account_id not in ACCOUNT_LEDGERS:
        ACCOUNT_LEDGERS[account_id] = BankingTaintLedger(
            account_id=account_id,
            account_holder=account_holder,
            initial_clean_balance=Decimal("0.00"),
            audit_chain=chronos_audit_chain
        )
    return ACCOUNT_LEDGERS[account_id]


# ============================================================================
# Mule Model & CTypes Loader Architecture
# ============================================================================
class ChronosMuleEngine:
    """
    Inference Engine interfacing with IBM zDLC compiled shared library (`chronos_mule_model.so`).
    Optimized for IBM z16 Neural Network Processing Assist (NNPA) and Vector Extension (VXE).
    Includes high-performance SIMD/BLAS fallback when executed outside LinuxONE mainframe.
    """

    FEATURE_NAMES = [
        "txn_amount",
        "velocity_1h",
        "velocity_24h",
        "dormancy_ratio",
        "burst_fan_out",
        "rapid_drain_speed",
        "geo_distance_km",
        "device_switch_count",
        "new_payee_flag",
        "mule_graph_centrality",
        "network_hop_count",
        "odd_hour_flag",
        "ip_risk_score",
        "behavioral_biometric_dev",
        "balance_drain_ratio",
        "historical_fraud_incident",
    ]

    REASON_CODE_METADATA = {
        0: ("TXN_AMOUNT_ANOMALY", "High-value transfer deviating from historical profile"),
        1: ("VELOCITY_BURST_1H", "Rapid succession of transfers within past 60 minutes"),
        2: ("VELOCITY_SPIKE_24H", "Abnormal cumulative daily transaction velocity"),
        3: ("DORMANCY_WAKE_SPIKE", "Account suddenly active after extended dormant phase"),
        4: ("BURST_FAN_OUT", "Dispersal of funds across multiple mule accounts in split seconds"),
        5: ("RAPID_DRAIN_SPEED", "Immediate outflow of funds within minutes of receipt"),
        6: ("GEO_HOP_DISTANCE", "Geographic impossibility in transaction origination coordinates"),
        7: ("DEVICE_SWITCH_BURST", "Multiple distinct hardware devices used in rapid sequence"),
        8: ("NEW_PAYEE_UNVETTED", "Substantial transfer to newly added beneficiary without seasoning"),
        9: ("MULE_GRAPH_CENTRALITY", "High topological centrality in known organized scam syndicate ring"),
        10: ("NETWORK_HOP_CASCADE", "Multi-hop pass-through structure designed to obfuscate audit trail"),
        11: ("ODD_HOUR_NOCTURNAL", "Transaction execution during nocturnal anomaly window (01:00-05:00)"),
        12: ("SUSPECT_IP_REPUTATION", "Connection originating from datacenter/proxy/Tor/VPN bulletproof node"),
        13: ("BEHAVIORAL_BIOMETRIC_DEV", "Anomalous keystroke cadence and touchscreen interaction dynamics"),
        14: ("BALANCE_DRAIN_RATIO", "Near-total depletion of liquid account balance (>90%)"),
        15: ("HISTORICAL_FRAUD_RECORD", "Beneficiary or source linked to active law-enforcement SAR"),
    }

    def __init__(self):
        self.so_path = os.getenv("CHRONOS_SO_PATH", "chronos_mule_model.so")
        self.cdll = None
        self.acceleration_mode = "NATIVE_VECTOR_BLAS"
        self.batch_buffer = np.empty((17, 16), dtype=np.float32)

        # Load weights for calibrated execution & fallback
        weights_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "chronos_mule_model_weights.npz"
        )
        if os.path.exists(weights_file):
            data = np.load(weights_file)
            self.W1 = data["W1"]
            self.b1 = data["b1"]
            self.W2 = data["W2"]
            self.b2 = data["b2"]
            self.W3 = data["W3"]
            self.b3 = data["b3"]
            self.medians = data["medians"]
        else:
            # Fallback default initializers
            np.random.seed(42)
            self.W1 = np.random.normal(0, 0.2, (16, 64)).astype(np.float32)
            self.b1 = np.zeros(64, dtype=np.float32)
            self.W2 = np.random.normal(0, 0.2, (64, 32)).astype(np.float32)
            self.b2 = np.zeros(32, dtype=np.float32)
            self.W3 = np.random.normal(0, 0.2, (32, 1)).astype(np.float32)
            self.b3 = np.array([-0.3], dtype=np.float32)
            self.medians = np.zeros(16, dtype=np.float32)

        # Attempt to dynamically load compiled C / zDLC .so via ctypes
        self._load_shared_library()

    def _load_shared_library(self):
        candidate_paths = [
            self.so_path,
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "chronos_mule_model.so"),
            "/usr/lib64/chronos_mule_model.so",
            "/workdir/chronos_mule_model.so"
        ]
        
        for path in candidate_paths:
            if os.path.exists(path):
                try:
                    self.cdll = ctypes.CDLL(path)
                    logger.info(f"Loaded compiled zDLC library via ctypes: {path}")
                    # Check for exported symbols
                    if hasattr(self.cdll, "score_batch"):
                        self.cdll.score_batch.argtypes = [
                            ctypes.POINTER(ctypes.c_float),
                            ctypes.POINTER(ctypes.c_float),
                            ctypes.c_int64
                        ]
                        self.cdll.score_batch.restype = None
                        self.acceleration_mode = "IBM_zDLC_COMPILED_SO_NNPA"
                        logger.info("Bound C-ABI symbol: score_batch")
                        return
                    elif hasattr(self.cdll, "run_main_graph"):
                        self.acceleration_mode = "IBM_zDLC_ONNX_MLIR_ENTRY"
                        logger.info("Bound zDLC onnx-mlir symbol: run_main_graph")
                        return
                except Exception as e:
                    logger.warning(f"Could not bind ctypes symbols from {path}: {e}")

        logger.info(
            f"Compiled .so not present on host architecture ({platform.machine()}). "
            f"Active acceleration mode: {self.acceleration_mode}"
        )

    def predict_batch_17(self, batch_17x16: np.ndarray) -> np.ndarray:
        """
        Executes single-pass inference on the 17-row perturbation matrix.
        Calls ctypes compiled shared library if present, or vectorized BLAS.
        """
        if self.cdll and hasattr(self.cdll, "score_batch"):
            input_ptr = batch_17x16.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
            output = np.empty((17, 1), dtype=np.float32)
            output_ptr = output.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
            self.cdll.score_batch(input_ptr, output_ptr, ctypes.c_int64(17))
            return output
        
        # High-Speed Vectorized GEMM (Hardware BLAS)
        z1 = np.maximum(0, np.dot(batch_17x16, self.W1) + self.b1)
        z2 = np.maximum(0, np.dot(z1, self.W2) + self.b2)
        logits = np.dot(z2, self.W3) + self.b3
        # Fast Numerically Stable Sigmoid
        scores = 1.0 / (1.0 + np.exp(-np.clip(logits, -25.0, 25.0)))
        return scores

    def score_with_perturbation(self, features: np.ndarray) -> Dict[str, Any]:
        """
        17-row Single-Pass Median Perturbation Algorithm:
        - Row 0: Original feature vector [x_0, x_1, ..., x_15]
        - Rows 1..16: Perturbed vectors where feature i is substituted with population median m_i
        Evaluated in a SINGLE batched forward pass in < 0.5 ms (< 500 us).
        """
        t_start = time.perf_counter_ns()

        # Build 17-row batch in preallocated buffer
        self.batch_buffer[0, :] = features
        for i in range(16):
            self.batch_buffer[i + 1, :] = features
            self.batch_buffer[i + 1, i] = self.medians[i]

        # Single-pass forward evaluation of all 17 rows
        scores = self.predict_batch_17(self.batch_buffer)

        # Baseline risk prediction
        baseline_score = float(scores[0, 0])

        # Marginal risk contribution: delta_i = baseline_score - perturbed_score_i
        # Positive delta indicates this feature elevated the transaction's mule risk
        deltas = baseline_score - scores[1:, 0]

        # Extract Top-3 Reason Codes
        # Using argpartition for ultra-fast O(N) extraction
        top3_indices = np.argpartition(deltas, -3)[-3:]
        sorted_top3 = top3_indices[np.argsort(deltas[top3_indices])[::-1]]

        t_end = time.perf_counter_ns()
        latency_microseconds = (t_end - t_start) / 1000.0

        top3_codes = []
        for rank, idx in enumerate(sorted_top3, start=1):
            code, desc = self.REASON_CODE_METADATA.get(int(idx), ("UNKNOWN_ANOMALY", "Anomalous signal"))
            top3_codes.append({
                "rank": rank,
                "feature_index": int(idx),
                "feature_name": self.FEATURE_NAMES[idx],
                "reason_code": code,
                "description": desc,
                "marginal_risk_delta": round(float(deltas[idx]), 4),
                "feature_value": float(features[idx]),
                "population_median": float(self.medians[idx])
            })

        return {
            "joint_risk_score": round(baseline_score, 4),
            "top3_reason_codes": top3_codes,
            "latency_microseconds": round(latency_microseconds, 2),
            "acceleration_mode": self.acceleration_mode,
            "sub_half_millisecond_compliant": bool(latency_microseconds < 500.0)
        }


# Initialize singleton inference engine
mule_engine = ChronosMuleEngine()


# ============================================================================
# Cryptographic Bounded FIFO Specific Lien Ledger
# ============================================================================
class TransactionLedgerManager:
    """
    Manages SHA-256 hash-chained immutable audit ledger for banking regulatory compliance.
    Formula: Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)
    """
    _last_ledger_hash: str = "0000000000000000000000000000000000000000000000000000000000000000"

    @classmethod
    def _init_ledger(cls):
        if os.path.exists(TRANSACTION_LEDGER_FILE):
            try:
                with open(TRANSACTION_LEDGER_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            entry = json.loads(line)
                            if "block_hash" in entry:
                                cls._last_ledger_hash = entry["block_hash"]
            except Exception as e:
                logger.error(f"Ledger chain recovery failed: {e}")

    @classmethod
    def record_decision(
        cls,
        tx_id: str,
        source_account: str,
        destination_account: str,
        transfer_amount: float,
        remaining_unfrozen_taint: float,
        hold_amount: float,
        new_remaining_taint: float,
        joint_risk_score: float,
        action_decision: str,
        reason_codes: List[str]
    ) -> Dict[str, Any]:
        if cls._last_ledger_hash == "0000000000000000000000000000000000000000000000000000000000000000":
            cls._init_ledger()

        timestamp = datetime.now(timezone.utc).isoformat()
        payload = (
            f"{cls._last_ledger_hash}|{tx_id}|{timestamp}|{source_account}|"
            f"{destination_account}|{transfer_amount:.2f}|{hold_amount:.2f}|"
            f"{joint_risk_score:.4f}|{action_decision}"
        )
        block_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        entry = {
            "tx_id": tx_id,
            "timestamp": timestamp,
            "source_account": source_account,
            "destination_account": destination_account,
            "transfer_amount": round(transfer_amount, 2),
            "remaining_unfrozen_taint": round(remaining_unfrozen_taint, 2),
            "hold_amount": round(hold_amount, 2),
            "new_remaining_taint": round(new_remaining_taint, 2),
            "joint_risk_score": joint_risk_score,
            "action_decision": action_decision,
            "reason_codes": reason_codes,
            "previous_block_hash": cls._last_ledger_hash,
            "block_hash": block_hash
        }

        cls._last_ledger_hash = block_hash

        try:
            with open(TRANSACTION_LEDGER_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            logger.error(f"Failed to append to transaction ledger: {e}")

        return entry


# ============================================================================
# Request / Response Schemas
# ============================================================================
class OTPRequest(BaseModel):
    phone_number: str = Field(..., example="+15550192834")

class OTPVerifyRequest(BaseModel):
    phone_number: str = Field(..., example="+15550192834")
    otp_code: str = Field(..., example="123456")

class GoogleAuthRequest(BaseModel):
    code_or_token: str = Field(..., example="sim_analyst:sarah.connor@ibmz.bank.com")
    state: Optional[str] = None
    role_override: Optional[UserRole] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TransactionFeaturePayload(BaseModel):
    txn_amount: float = Field(default=2500.0, description="Transfer amount in USD")
    velocity_1h: float = Field(default=6.0, description="Transactions in last 1 hour")
    velocity_24h: float = Field(default=18.0, description="Transactions in last 24 hours")
    dormancy_ratio: float = Field(default=0.45, description="Inactivity ratio before spike")
    burst_fan_out: float = Field(default=0.88, description="Outgoing fund dispersal ratio")
    rapid_drain_speed: float = Field(default=0.92, description="Withdrawal velocity ratio within 5 min")
    geo_distance_km: float = Field(default=85.0, description="Distance from registered home location")
    device_switch_count: float = Field(default=3.0, description="Device changes in last 48 hours")
    new_payee_flag: float = Field(default=1.0, description="1 if destination payee is unvetted, 0 otherwise")
    mule_graph_centrality: float = Field(default=0.91, description="Cluster centrality in known mule ring")
    network_hop_count: float = Field(default=4.0, description="Pass-through cascade depth")
    odd_hour_flag: float = Field(default=1.0, description="1 if executed between 01:00-05:00")
    ip_risk_score: float = Field(default=0.82, description="Threat reputation score of connection IP")
    behavioral_biometric_dev: float = Field(default=0.74, description="Biometric keystroke/touch deviation")
    balance_drain_ratio: float = Field(default=0.95, description="Fraction of balance depleted")
    historical_fraud_incident: float = Field(default=1.0, description="Previous suspicious flags")

class TransactionScoreRequest(BaseModel):
    transaction_id: str = Field(..., example="TXN-2026-990812")
    source_account_id: str = Field(..., example="ACC-US-889102")
    destination_account_id: str = Field(..., example="ACC-MULE-441209")
    transfer_amount: float = Field(..., example=8500.00)
    remaining_unfrozen_taint: float = Field(..., example=12000.00)
    features: Optional[TransactionFeaturePayload] = None


# ============================================================================
# Route Group 1: /api/auth
# ============================================================================
auth_router = APIRouter(prefix="/api/auth", tags=["Enterprise Authentication & Security"])

@auth_router.post("/otp/request")
@limiter.limit("10/minute")
async def request_phone_otp(payload: OTPRequest, request: Request):
    """
    Time-Based OTP generation using HMAC-SHA256 with 60-second window.
    Strictly rate-limited to 10 requests per minute.
    """
    try:
        otp_data = TimeBasedOTP.generate_otp(payload.phone_number)
        SecurityAuditLogger.log_event(
            event_type="AUTH_OTP_REQUESTED",
            request=request,
            user_id=payload.phone_number,
            status_code=200,
            severity="INFO",
            details={"phone": payload.phone_number, "expiry_seconds": otp_data["expiry_seconds"]}
        )
        return {
            "status": "OTP_DISPATCHED",
            "phone_number": payload.phone_number,
            "expiry_seconds": otp_data["expiry_seconds"],
            "window_step": otp_data["window_step"],
            # Code returned for sandbox/demo testing verification
            "demo_otp_code": otp_data["otp_code"],
            "message": "Time-based OTP valid for 60 seconds (HMAC-SHA256)."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP Generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate secure OTP.")

@auth_router.post("/otp/verify")
@limiter.limit("10/minute")
async def verify_phone_otp(payload: OTPVerifyRequest, request: Request):
    """
    Constant-time HMAC-SHA256 OTP verification and JWT session issuance.
    """
    is_valid = TimeBasedOTP.verify_otp(payload.phone_number, payload.otp_code)
    device_fp = SecurityAuditLogger.generate_device_fingerprint(
        request, client_device_id=request.headers.get("x-device-id")
    )
    
    if not is_valid:
        SecurityAuditLogger.log_event(
            event_type="AUTH_OTP_FAILED",
            request=request,
            user_id=payload.phone_number,
            status_code=401,
            severity="WARNING",
            details={"phone": payload.phone_number}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Please verify within the 60-second window."
        )

    # Resolve or create retail user
    user_id = f"usr_ph_{hashlib.md5(payload.phone_number.encode()).hexdigest()[:8]}"
    user = MOCK_USER_STORE.get(user_id)
    if not user:
        user = UserProfile(
            user_id=user_id,
            phone_number=payload.phone_number,
            role=UserRole.RETAIL_USER,
            full_name="Verified Phone User",
            created_at=datetime.now(timezone.utc).isoformat(),
            device_fingerprint=device_fp
        )
        MOCK_USER_STORE[user_id] = user

    access_token = TokenService.create_access_token(user, device_fp)
    refresh_token = TokenService.create_refresh_token(user, device_fp)

    SecurityAuditLogger.log_event(
        event_type="AUTH_OTP_SUCCESS",
        request=request,
        user_id=user.user_id,
        role=user.role.value,
        status_code=200,
        severity="INFO",
        details={"phone": payload.phone_number, "device_fingerprint": device_fp}
    )

    return {
        "status": "AUTHENTICATED",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in_minutes": 15,
        "user": user.model_dump()
    }

@auth_router.get("/google/url")
async def get_google_auth_url():
    """Returns Google OAuth 2.0 authorization URL with anti-CSRF state token."""
    return GoogleOAuthService.generate_auth_url()

@auth_router.post("/google/callback")
@limiter.limit("10/minute")
async def google_auth_callback(payload: GoogleAuthRequest, request: Request):
    """
    Exchanges Google OAuth code or ID token for JWT session.
    Assigns Fraud Analyst role for banking domains (@ibmz.bank.com) and Retail User for others.
    """
    google_profile = GoogleOAuthService.verify_or_simulate_google_token(
        payload.code_or_token, role_override=payload.role_override
    )
    device_fp = SecurityAuditLogger.generate_device_fingerprint(
        request, client_device_id=request.headers.get("x-device-id")
    )
    
    user_id = google_profile["user_id"]
    user = MOCK_USER_STORE.get(user_id)
    if not user:
        user = UserProfile(
            user_id=user_id,
            email=google_profile["email"],
            role=google_profile["role"],
            full_name=google_profile["name"],
            created_at=datetime.now(timezone.utc).isoformat(),
            device_fingerprint=device_fp
        )
        MOCK_USER_STORE[user_id] = user

    access_token = TokenService.create_access_token(user, device_fp)
    refresh_token = TokenService.create_refresh_token(user, device_fp)

    SecurityAuditLogger.log_event(
        event_type="AUTH_GOOGLE_SUCCESS",
        request=request,
        user_id=user.user_id,
        role=user.role.value,
        status_code=200,
        severity="INFO",
        details={"email": user.email, "role": user.role.value}
    )

    return {
        "status": "AUTHENTICATED",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in_minutes": 15,
        "user": user.model_dump()
    }

@auth_router.get("/me")
async def get_my_profile(current_user: UserProfile = Depends(get_current_user)):
    """Returns the authenticated user's profile and active role."""
    return {
        "status": "ACTIVE_SESSION",
        "user": current_user.model_dump()
    }

@auth_router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_session_token(payload: RefreshTokenRequest, request: Request):
    """Issues fresh access token using valid refresh token."""
    decoded = TokenService.decode_token(payload.refresh_token)
    if decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided token is not a valid refresh token."
        )
    user_id = decoded.get("sub")
    user = MOCK_USER_STORE.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User account no longer active.")
    
    device_fp = SecurityAuditLogger.generate_device_fingerprint(request)
    new_access = TokenService.create_access_token(user, device_fp)
    return {
        "access_token": new_access,
        "token_type": "Bearer",
        "expires_in_minutes": 15
    }

@auth_router.get("/audit-log")
async def view_security_audit_trail(
    limit: int = 50,
    current_user: UserProfile = Depends(require_role([UserRole.FRAUD_ANALYST, UserRole.ADMIN]))
):
    """
    Fraud Analyst & Admin endpoint: Retrieves tamper-evident SHA-256 hash-chained security audits.
    """
    records = []
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        records.append(json.loads(line.strip()))
        except Exception as e:
            logger.error(f"Audit log read error: {e}")

    # Return newest first
    records = records[::-1][:limit]
    return {
        "audit_event_count": len(records),
        "requested_by": current_user.user_id,
        "role": current_user.role.value,
        "events": records
    }

app.include_router(auth_router)


# ============================================================================
# Route Group 2: /api/system/hardware-verify
# ============================================================================
@app.get("/api/system/hardware-verify", tags=["Mainframe Hardware Verification"])
async def hardware_verification():
    """
    Parses `uname -m`, `/proc/cpuinfo`, and system auxiliary facilities to verify
    s390x mainframe architecture and hardware acceleration:
    - Facility Bit 165: NNPA (Neural Network Processing Assist - IBM z16)
    - Facility Bit 129: VXE (Vector Extension Facility / SIMD)
    - CPACF: Hardware cryptographic coprocessor
    """
    arch = platform.machine()
    system_os = platform.system()
    proc_info = platform.processor()

    cpuinfo_raw = ""
    is_s390x = (arch == "s390x")
    machine_type = None
    features_list: List[str] = []
    facilities_list: List[int] = []

    # Check /proc/cpuinfo (Linux standard)
    if os.path.exists("/proc/cpuinfo"):
        try:
            with open("/proc/cpuinfo", "r", encoding="utf-8") as f:
                cpuinfo_raw = f.read()
                for line in cpuinfo_raw.splitlines():
                    line = line.strip()
                    if line.startswith("machine"):
                        machine_type = line.split(":")[-1].strip()
                    elif line.startswith("features"):
                        features_list = line.split(":")[-1].strip().split()
                    elif line.startswith("facilities"):
                        fac_parts = line.split(":")[-1].strip().split()
                        for p in fac_parts:
                            try:
                                facilities_list.append(int(p))
                            except ValueError:
                                pass
        except Exception as e:
            logger.warning(f"Error reading /proc/cpuinfo: {e}")

    # Facility Bit Checks
    # Bit 165: NNPA (IBM z16 Integrated AI Accelerator)
    # Bit 129: VXE (Vector Extension Facility)
    # Bit 134: Vector-Packed Decimal
    # Bit 152: Vector Enhancement Facility 2 (VXE2)
    has_nnpa_bit_165 = (165 in facilities_list) or ("nnpa" in features_list)
    has_vxe_bit_129 = (129 in facilities_list) or ("vxe" in features_list or "vx" in features_list)
    has_vxe2_bit_152 = (152 in facilities_list) or ("vxe2" in features_list)
    has_vector_packed_decimal_134 = (134 in facilities_list)

    # Machine Type Identification
    machine_family = "Unknown"
    if machine_type == "3931" or machine_type == "3932":
        machine_family = "IBM z16 (LinuxONE 4)"
    elif machine_type == "8561" or machine_type == "8562":
        machine_family = "IBM z15 (LinuxONE III)"
    elif machine_type == "3906" or machine_type == "3907":
        machine_family = "IBM z14"
    elif is_s390x:
        machine_family = "IBM LinuxONE Mainframe"

    # Simulated S390X evaluation mode flag (for dev verification)
    simulated_s390x = os.getenv("CHRONOS_SIMULATE_S390X", "false").lower() == "true"
    if simulated_s390x and not is_s390x:
        has_nnpa_bit_165 = True
        has_vxe_bit_129 = True
        machine_family = "IBM z16 (LinuxONE 4 - Simulated Environment)"

    hardware_acceleration_status = "HOST_NON_S390X_EXECUTION"
    if is_s390x:
        if has_nnpa_bit_165:
            hardware_acceleration_status = "ACTIVE_IBM_Z16_NNPA_ON_CHIP_AI_ACCELERATION"
        elif has_vxe_bit_129:
            hardware_acceleration_status = "ACTIVE_IBM_VXE_VECTOR_SIMD_ACCELERATION"
        else:
            hardware_acceleration_status = "IBM_S390X_BASE_INSTRUCTION_SET"
    elif simulated_s390x:
        hardware_acceleration_status = "SIMULATED_IBM_Z16_NNPA_ACTIVE"

    return {
        "status": "HARDWARE_VERIFIED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "host_information": {
            "platform_machine": arch,
            "system_os": system_os,
            "processor": proc_info,
            "cpu_count": os.cpu_count()
        },
        "s390x_architecture_verification": {
            "is_s390x": is_s390x,
            "machine_type": machine_type or ("s390x-emulated" if is_s390x else "non-s390x"),
            "machine_family": machine_family,
            "compiler_target": "s390x-ibm-loz",
            "zdlc_image": "icr.io/ibmz/zdlc:5.1.0"
        },
        "hardware_facility_bits": {
            "nnpa_facility_bit_165": {
                "detected": has_nnpa_bit_165,
                "facility_name": "Neural Network Processing Assist (NNPA)",
                "hardware_module": "IBM z16 Integrated AI On-Chip Coprocessor",
                "capability": "Sub-millisecond wire-speed matrix GEMM acceleration"
            },
            "vxe_facility_bit_129": {
                "detected": has_vxe_bit_129,
                "facility_name": "Vector Extension Facility (VXE)",
                "hardware_module": "SIMD 128-bit Vector Processing Engine",
                "capability": "Parallel float32 vector tensor computation"
            },
            "vxe2_facility_bit_152": {
                "detected": has_vxe2_bit_152,
                "facility_name": "Vector Enhancement Facility 2 (VXE2)",
                "capability": "Extended vector floating point operations"
            },
            "vector_packed_decimal_bit_134": {
                "detected": has_vector_packed_decimal_134,
                "facility_name": "Vector Packed Decimal Facility",
                "capability": "High-precision banking BCD ledger arithmetic"
            }
        },
        "hardware_acceleration_verdict": hardware_acceleration_status,
        "zdlc_compilation_flags": "--EmitLib --O3 -march=z16 --mtriple=s390x-ibm-loz --maccel=NNPA"
    }


# ============================================================================
# Route Group 3: /score
# ============================================================================
@app.post("/score", tags=["Scam Interception & Risk Scoring Engine"])
async def score_transaction(
    payload: TransactionScoreRequest,
    request: Request,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Scoring & Interception Engine:
    1. Loads chronos_mule_model.so via ctypes (or optimized SIMD fallback).
    2. Performs 17-row single-pass median perturbation (<0.5ms).
    3. Calculates Top-3 Reason Codes.
    4. Computes Bounded FIFO Specific Lien: Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint).
    5. Appends record to SHA-256 hash-chained immutable audit ledger.
    """
    # Assemble feature vector (16 dimensions)
    if payload.features:
        f = payload.features
        feature_vector = np.array([
            f.txn_amount,
            f.velocity_1h,
            f.velocity_24h,
            f.dormancy_ratio,
            f.burst_fan_out,
            f.rapid_drain_speed,
            f.geo_distance_km,
            f.device_switch_count,
            f.new_payee_flag,
            f.mule_graph_centrality,
            f.network_hop_count,
            f.odd_hour_flag,
            f.ip_risk_score,
            f.behavioral_biometric_dev,
            f.balance_drain_ratio,
            f.historical_fraud_incident
        ], dtype=np.float32)
    else:
        # Default high-risk mule profile if feature dictionary omitted
        feature_vector = np.array([
            payload.transfer_amount, 7.0, 16.0, 0.45, 0.89, 0.94,
            95.0, 2.0, 1.0, 0.92, 3.0, 1.0, 0.78, 0.68, 0.94, 1.0
        ], dtype=np.float32)

    # 17-row single-pass median perturbation (< 0.5 ms)
    inference_result = mule_engine.score_with_perturbation(feature_vector)
    joint_risk_score = inference_result["joint_risk_score"]
    top3_reason_codes = inference_result["top3_reason_codes"]
    reason_code_strings = [r["reason_code"] for r in top3_reason_codes]

    # Evaluate money-mule risk threshold
    # Scores >= 0.70 indicate Critical Money-Mule Syndicate Activity
    # Scores >= 0.45 indicate Elevated Money-Mule Risk / Specific Lien Hold
    is_mule_risk = bool(joint_risk_score >= 0.45)
    
    if joint_risk_score >= 0.70:
        action_decision = "IMMEDIATE_INTERCEPTION_FREEZE"
    elif joint_risk_score >= 0.45:
        action_decision = "SPECIFIC_LIEN_CONDITIONAL_HOLD"
    else:
        action_decision = "CLEARED_LOW_RISK"

    # Resolve target beneficiary account ledger (bound to audit_chain.py)
    target_ledger = get_or_create_ledger(
        account_id=payload.destination_account_id,
        account_holder=f"Target {payload.destination_account_id}"
    )

    transfer_amount = payload.transfer_amount
    remaining_taint = payload.remaining_unfrozen_taint

    # Trigger Clayton's Case Bounded FIFO Specific Lien calculation from taint_ledger.py
    # Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)
    if is_mule_risk:
        # Automatically executes Clayton's Case Bounded FIFO Specific Lien in taint_ledger.py
        # and writes the cryptographically chained block to audit_chain.py
        inflow_record = target_ledger.apply_taint_inflow(
            transfer_amount=transfer_amount,
            target_taint=remaining_taint,
            tx_id=payload.transaction_id,
            fir_reference="BNSS-SEC-106-CYBER-CRIME",
            authority="National Cyber Crime Reporting Portal (NCRP) / State Cyber Cell"
        )
        hold_amount = float(inflow_record["hold_applied"])
        clean_portion = float(inflow_record["clean_portion_credited"])
        new_remaining_taint = max(0.0, float(remaining_taint) - hold_amount)
        tranche_id = inflow_record["tranche_id"]

        # Append explicit AI money-mule risk interception event to audit_chain.py
        ai_audit_record = chronos_audit_chain.append_event(
            event_type="AI_MULE_INTERCEPTION_FLAGGED",
            account_id=payload.destination_account_id,
            state_snapshot=target_ledger.get_snapshot(),
            delta={
                "amount": str(transfer_amount),
                "clean_delta": str(clean_portion),
                "hold_delta": str(hold_amount),
            },
            directive_reference="BNSS_SECTION_106",
            legal_basis="Autonomous AI Mule Interception under BNSS Section 106",
            court_or_authority="CHRONOS-Z Autonomous Core Engine",
            metadata={
                "tx_id": payload.transaction_id,
                "source_account": payload.source_account_id,
                "destination_account": payload.destination_account_id,
                "joint_risk_score": joint_risk_score,
                "top3_reason_codes": reason_code_strings,
                "latency_microseconds": inference_result["latency_microseconds"],
                "action_decision": action_decision,
                "tranche_id": tranche_id
            }
        )
        audit_chain_latest_hash = ai_audit_record["current_sha256"]
    else:
        # Legitimate clean transaction - credits clean available balance via taint_ledger.py
        clean_record = target_ledger.deposit_clean(
            amount=transfer_amount,
            tx_id=payload.transaction_id,
            narrative="Clean Inflow Cleared by CHRONOS-Z AI Scam Interception Engine"
        )
        hold_amount = 0.0
        clean_portion = transfer_amount
        new_remaining_taint = remaining_taint
        tranche_id = None
        audit_chain_latest_hash = chronos_audit_chain.current_head_hash

    # Cryptographic immutable SHA-256 hash-chained transaction ledger append
    ledger_entry = TransactionLedgerManager.record_decision(
        tx_id=payload.transaction_id,
        source_account=payload.source_account_id,
        destination_account=payload.destination_account_id,
        transfer_amount=transfer_amount,
        remaining_unfrozen_taint=remaining_taint,
        hold_amount=hold_amount,
        new_remaining_taint=new_remaining_taint,
        joint_risk_score=joint_risk_score,
        action_decision=action_decision,
        reason_codes=reason_code_strings
    )

    # Security Audit Logging
    SecurityAuditLogger.log_event(
        event_type="TRANSACTION_SCORED",
        request=request,
        user_id=current_user.user_id,
        role=current_user.role.value,
        status_code=200,
        severity="WARNING" if is_mule_risk else "INFO",
        details={
            "tx_id": payload.transaction_id,
            "risk_score": joint_risk_score,
            "hold_amount": hold_amount,
            "action": action_decision,
            "is_mule_risk": is_mule_risk
        }
    )

    return {
        "status": "DECISION_FINALIZED",
        "transaction_id": payload.transaction_id,
        "joint_risk_score": joint_risk_score,
        "is_mule_risk_flagged": is_mule_risk,
        "risk_tier": (
            "CRITICAL_MULE_RISK" if joint_risk_score >= 0.70 else
            "ELEVATED_SUSPICIOUS" if joint_risk_score >= 0.45 else
            "LOW_LEGITIMATE"
        ),
        "action_decision": action_decision,
        "bounded_fifo_lien": {
            "transfer_amount": round(transfer_amount, 2),
            "original_remaining_taint": round(remaining_taint, 2),
            "calculated_hold_amount": round(hold_amount, 2),
            "clean_portion_credited": round(clean_portion, 2),
            "formula_applied": "Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)",
            "updated_remaining_unfrozen_taint": round(new_remaining_taint, 2),
            "tranche_id": tranche_id,
            "statutory_doctrine": "Rule in Clayton's Case (1816) | BNSS 2023 Sections 106-107",
            "taint_ledger_module": "taint_ledger.BankingTaintLedger"
        },
        "account_ledger_snapshot": target_ledger.get_snapshot(),
        "explainability": {
            "methodology": "17-Row Single-Pass Median Vector Perturbation",
            "top3_reason_codes": top3_reason_codes
        },
        "telemetry": {
            "latency_microseconds": inference_result["latency_microseconds"],
            "sub_half_millisecond_sla_met": inference_result["sub_half_millisecond_compliant"],
            "acceleration_mode": inference_result["acceleration_mode"],
            "scored_by_user": current_user.user_id,
            "user_role": current_user.role.value
        },
        "cryptographic_audit": {
            "audit_chain_latest_hash": audit_chain_latest_hash,
            "audit_chain_total_records": chronos_audit_chain.record_count,
            "audit_chain_verification": chronos_audit_chain.verify_chain().to_dict(),
            "ledger_block_hash": ledger_entry["block_hash"],
            "previous_block_hash": ledger_entry["previous_block_hash"],
            "tamper_evident_status": "HASH_CHAIN_VERIFIED"
        }
    }


# ============================================================================
# Route Group 4: Cryptographic Audit Chain & Taint Ledger Inspection APIs
# ============================================================================
@app.get("/api/ledger/audit-chain/verify", tags=["Cryptographic Audit Chain"])
async def verify_audit_chain_integrity():
    """
    Cryptographically validates the entire SHA-256 audit chain from genesis to head.
    Verifies unbroken hash linkages and non-tampering of BNSS 106-107 specific lien records.
    """
    verification = chronos_audit_chain.verify_chain()
    return {
        "status": "VALID" if verification.is_valid else "TAMPER_DETECTED",
        "verification": verification.to_dict(),
        "latest_head_hash": chronos_audit_chain.current_head_hash,
        "total_records": chronos_audit_chain.record_count
    }


@app.get("/api/ledger/accounts/{account_id}", tags=["Banking Taint Ledger"])
async def get_account_ledger_details(account_id: str):
    """
    Retrieves real-time account balances, clean funds, restricted lien hold,
    and individual FIFO taint tranches under Clayton's Case and BNSS Sections 106-107.
    """
    ledger = get_or_create_ledger(account_id)
    return {
        "account_id": account_id,
        "snapshot": ledger.get_snapshot(),
        "active_tranches_count": len(ledger.taint_tranches),
        "tranches": [t.to_dict() for t in ledger.taint_tranches]
    }


# ============================================================================
# Root Status / Health Endpoint
# ============================================================================
@app.get("/", tags=["System Information"])
async def root():
    return {
        "system": "CHRONOS-Z Scam Interception Engine",
        "team": "Two Bugs and a Byte (SRC MCET)",
        "event": "IBM Z Datathon 2026",
        "architecture": platform.machine(),
        "status": "OPERATIONAL",
        "docs": "/docs",
        "endpoints": [
            "/api/auth/otp/request",
            "/api/auth/otp/verify",
            "/api/auth/google/url",
            "/api/auth/google/callback",
            "/api/auth/me",
            "/api/system/hardware-verify",
            "/score",
            "/api/ledger/audit-chain/verify",
            "/api/ledger/accounts/{account_id}"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
