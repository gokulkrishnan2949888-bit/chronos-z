/**
 * CHRONOS-Z Live Backend API Client
 * Target: https://whale-specifications-showers-having.trycloudflare.com
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://whale-specifications-showers-having.trycloudflare.com';

let cachedAccessToken: string | null = null;

export interface HardwareVerificationResponse {
  status: string;
  timestamp: string;
  host_information: {
    platform_machine: string;
    system_os: string;
    processor: string;
    cpu_count: number;
  };
  s390x_architecture_verification: {
    is_s390x: boolean;
    machine_type: string;
    machine_family: string;
    compiler_target: string;
    zdlc_image: string;
  };
  hardware_facility_bits: {
    nnpa_facility_bit_165: {
      detected: boolean;
      facility_name: string;
      hardware_module: string;
      capability: string;
    };
    vxe_facility_bit_129: {
      detected: boolean;
      facility_name: string;
      hardware_module: string;
      capability: string;
    };
    vxe2_facility_bit_152: {
      detected: boolean;
      facility_name: string;
      capability: string;
    };
    vector_packed_decimal_bit_134: {
      detected: boolean;
      facility_name: string;
      capability: string;
    };
  };
  hardware_acceleration_verdict: string;
  zdlc_compilation_flags: string;
}

export interface TransactionScoreResponse {
  status: string;
  transaction_id: string;
  joint_risk_score: number;
  is_mule_risk_flagged?: boolean;
  risk_tier: string;
  action_decision: string;
  bounded_fifo_lien: {
    transfer_amount: number;
    original_remaining_taint: number;
    calculated_hold_amount: number;
    clean_portion_credited?: number;
    formula_applied: string;
    updated_remaining_unfrozen_taint: number;
    statutory_doctrine?: string;
  };
  account_ledger_snapshot?: {
    account_id: string;
    account_holder: string;
    clean_available_balance: string;
    restricted_taint_hold: string;
    total_balance: string;
    currency: string;
  };
  explainability: {
    methodology: string;
    top3_reason_codes: Array<{
      rank: number;
      feature_index: number;
      feature_name: string;
      reason_code: string;
      description: string;
      marginal_risk_delta: number;
      feature_value: number;
      population_median: number;
    }>;
  };
  telemetry: {
    latency_microseconds: number;
    sub_half_millisecond_sla_met: boolean;
    acceleration_mode: string;
    scored_by_user: string;
    user_role: string;
  };
  cryptographic_audit: {
    ledger_block_hash: string;
    previous_block_hash: string;
    tamper_evident_status: string;
    audit_chain_latest_hash?: string;
    audit_chain_total_records?: number;
    audit_chain_verification?: {
      is_valid?: boolean;
      total_records?: number;
      genesis_hash?: string;
      latest_hash?: string;
    };
  };
}

export interface ScorePayload {
  transaction_id: string;
  source_account_id: string;
  destination_account_id: string;
  transfer_amount: number;
  remaining_unfrozen_taint: number;
  features?: {
    txn_amount?: number;
    velocity_1h?: number;
    velocity_24h?: number;
    dormancy_ratio?: number;
    burst_fan_out?: number;
    rapid_drain_speed?: number;
    geo_distance_km?: number;
    device_switch_count?: number;
    new_payee_flag?: number;
    mule_graph_centrality?: number;
    network_hop_count?: number;
    odd_hour_flag?: number;
    ip_risk_score?: number;
    behavioral_biometric_dev?: number;
    balance_drain_ratio?: number;
    historical_fraud_incident?: number;
  };
}

/**
 * Get or ensure valid Bearer token from backend
 */
export async function getAuthToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('chronos_access_token');
    if (saved) return saved;
  }
  if (cachedAccessToken) return cachedAccessToken;

  try {
    // Request a demo OTP
    const reqRes = await fetch(`${BACKEND_URL}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919876543210' }),
    });
    const reqData = await reqRes.json();
    const otpCode = reqData.demo_otp_code || '123456';

    // Verify OTP to get token
    const verifyRes = await fetch(`${BACKEND_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: '+919876543210',
        otp_code: String(otpCode),
      }),
    });
    const verifyData = await verifyRes.json();
    if (verifyData.access_token) {
      cachedAccessToken = verifyData.access_token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chronos_access_token', verifyData.access_token);
      }
      return verifyData.access_token;
    }
  } catch (err) {
    console.warn('Auto auth token negotiation fallback', err);
  }

  return cachedAccessToken || '';
}

/**
 * Fetch live hardware verification from IBM LinuxONE backend
 */
export async function fetchHardwareVerification(): Promise<HardwareVerificationResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/system/hardware-verify`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch hardware verification:', err);
    return null;
  }
}

/**
 * Score transaction & compute bounded FIFO specific lien
 */
export async function postScoreTransaction(
  payload: ScorePayload
): Promise<TransactionScoreResponse | null> {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_URL}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      // Refresh token once if expired
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chronos_access_token');
      }
      cachedAccessToken = null;
      const newToken = await getAuthToken();
      const retryRes = await fetch(`${BACKEND_URL}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
      return await retryRes.json();
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to score transaction:', err);
    return null;
  }
}

/**
 * Request OTP from backend
 */
export async function requestOtpFromBackend(phoneNumber: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
  return await res.json();
}

/**
 * Verify OTP with backend
 */
export async function verifyOtpWithBackend(phoneNumber: string, otpCode: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode }),
  });
  const data = await res.json();
  if (data.access_token) {
    cachedAccessToken = data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('chronos_access_token', data.access_token);
    }
  }
  return data;
}
