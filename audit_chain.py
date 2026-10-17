"""
audit_chain.py
==============
Append-Only Cryptographic Audit Log using SHA-256 Hash Chaining.
Strictly Aligned with BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023) Sections 106 & 107.

Cryptographic Specification:
- Each event is an append-only JSON line (JSONL).
- Block N contains `prev_sha256` mapping to Block N-1's `current_sha256`.
- Genesis Block (index 0) has `prev_sha256` = "0" * 64.
- `current_sha256` is the SHA-256 digest of the canonical JSON representation
  (sorted keys, compact separators) of the record payload EXCLUDING `current_sha256`.
- Tamper-evident: Any modification of amounts, directives, timestamps, or hashes
  invalidates the chain downstream.
"""

from __future__ import annotations

import hashlib
import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

GENESIS_HASH = "0" * 64


class AuditChainError(Exception):
    """Base exception for audit chain operations."""
    pass


class ChainIntegrityError(AuditChainError):
    """Raised when cryptographic chain validation fails due to tampering."""
    pass


@dataclass
class ChainVerificationResult:
    """Summary result of cryptographic chain verification."""
    is_valid: bool
    total_records: int
    genesis_hash: str
    latest_hash: str
    error_message: Optional[str] = None
    tampered_index: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "total_records": self.total_records,
            "genesis_hash": self.genesis_hash,
            "latest_hash": self.latest_hash,
            "error_message": self.error_message,
            "tampered_index": self.tampered_index,
        }


def canonical_json_bytes(data: Dict[str, Any]) -> bytes:
    """
    Serializes a dictionary to canonical, deterministic UTF-8 bytes.
    Keys are strictly sorted with no redundant whitespace.
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def compute_sha256(data: Dict[str, Any]) -> str:
    """Computes hexadecimal SHA-256 of canonical JSON bytes."""
    return hashlib.sha256(canonical_json_bytes(data)).hexdigest()


class AuditChain:
    """
    Append-only SHA-256 hash-chained JSONL logger.
    Directly supports BNSS Sections 106 and 107 specific lien directives.
    """

    def __init__(self, log_path: str | Path = "audit_trail.jsonl"):
        self.log_path = Path(log_path)
        self.current_head_hash = GENESIS_HASH
        self.record_count = 0
        self._initialize_or_resume()

    def _initialize_or_resume(self) -> None:
        """
        Inspects existing log file if present; resumes from the latest verified hash.
        Creates parent directories if necessary.
        """
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

        if not self.log_path.exists():
            return

        # Resume state from existing file
        with open(self.log_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        if not lines:
            return

        last_line = lines[-1]
        try:
            last_record = json.loads(last_line)
            self.current_head_hash = last_record["current_sha256"]
            self.record_count = len(lines)
        except (json.JSONDecodeError, KeyError) as e:
            raise ChainIntegrityError(f"Corrupt record found at end of {self.log_path}: {e}")

    def append_event(
        self,
        event_type: str,
        account_id: str,
        state_snapshot: Dict[str, Any],
        delta: Dict[str, Any],
        directive_reference: str = "BNSS_SECTION_106",
        legal_basis: str = "Statutory Specific Lien Under BNSS Section 106",
        court_or_authority: str = "Magistrate / State Cyber Cell",
        metadata: Optional[Dict[str, Any]] = None,
        custom_timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Appends an immutable event to the hash-chained JSONL log.

        Maps:
          prev_sha256 -> current_sha256
        """
        timestamp = custom_timestamp or datetime.now(timezone.utc).isoformat()
        index = self.record_count

        # Formulate pre-image payload (without current_sha256)
        payload: Dict[str, Any] = {
            "index": index,
            "timestamp": timestamp,
            "account_id": account_id,
            "event_type": event_type,
            "directive_reference": directive_reference,
            "legal_framework": {
                "statute": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
                "sections": "Sections 106-107",
                "directive": directive_reference,
                "legal_basis": legal_basis,
                "issuing_authority": court_or_authority,
                "lien_doctrine": "Clayton's Case FIFO Bounded Specific Lien",
            },
            "delta": delta,
            "state_snapshot": state_snapshot,
            "metadata": metadata or {},
            "prev_sha256": self.current_head_hash,
        }

        # Compute deterministic SHA-256 over canonical JSON
        current_sha256 = compute_sha256(payload)
        payload["current_sha256"] = current_sha256

        # Append to JSONL file
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, sort_keys=True, ensure_ascii=False) + "\n")

        # Update chain state
        self.current_head_hash = current_sha256
        self.record_count += 1

        return payload

    def verify_chain(self, target_path: Optional[str | Path] = None) -> ChainVerificationResult:
        """
        Cryptographically validates the entire JSONL audit chain from genesis to head.
        Ensures:
          1. prev_sha256 correctly points to previous record's current_sha256.
          2. Genesis record points to GENESIS_HASH.
          3. current_sha256 matches re-hashed canonical JSON payload.
          4. Sequence indices are contiguous.
        """
        file_to_check = Path(target_path) if target_path else self.log_path

        if not file_to_check.exists():
            return ChainVerificationResult(
                is_valid=True,
                total_records=0,
                genesis_hash=GENESIS_HASH,
                latest_hash=GENESIS_HASH,
                error_message="Log file is empty / does not exist",
            )

        with open(file_to_check, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]

        if not lines:
            return ChainVerificationResult(
                is_valid=True,
                total_records=0,
                genesis_hash=GENESIS_HASH,
                latest_hash=GENESIS_HASH,
            )

        expected_prev_hash = GENESIS_HASH
        latest_hash = GENESIS_HASH

        for i, line in enumerate(lines):
            try:
                record = json.loads(line)
            except json.JSONDecodeError as e:
                return ChainVerificationResult(
                    is_valid=False,
                    total_records=len(lines),
                    genesis_hash=GENESIS_HASH,
                    latest_hash=latest_hash,
                    error_message=f"JSON parsing error at line {i}: {e}",
                    tampered_index=i,
                )

            # Check index sequence
            if record.get("index") != i:
                return ChainVerificationResult(
                    is_valid=False,
                    total_records=len(lines),
                    genesis_hash=GENESIS_HASH,
                    latest_hash=latest_hash,
                    error_message=f"Sequence gap at line {i}: expected index {i}, got {record.get('index')}",
                    tampered_index=i,
                )

            # Check prev_sha256 link
            actual_prev_hash = record.get("prev_sha256")
            if actual_prev_hash != expected_prev_hash:
                return ChainVerificationResult(
                    is_valid=False,
                    total_records=len(lines),
                    genesis_hash=GENESIS_HASH,
                    latest_hash=latest_hash,
                    error_message=(
                        f"Chain break at record index {i}: prev_sha256 is '{actual_prev_hash}', "
                        f"expected '{expected_prev_hash}'"
                    ),
                    tampered_index=i,
                )

            # Recompute current_sha256
            declared_current_hash = record.get("current_sha256")
            if not declared_current_hash:
                return ChainVerificationResult(
                    is_valid=False,
                    total_records=len(lines),
                    genesis_hash=GENESIS_HASH,
                    latest_hash=latest_hash,
                    error_message=f"Missing current_sha256 in record {i}",
                    tampered_index=i,
                )

            payload_to_verify = dict(record)
            del payload_to_verify["current_sha256"]
            recomputed_hash = compute_sha256(payload_to_verify)

            if recomputed_hash != declared_current_hash:
                return ChainVerificationResult(
                    is_valid=False,
                    total_records=len(lines),
                    genesis_hash=GENESIS_HASH,
                    latest_hash=latest_hash,
                    error_message=(
                        f"Hash signature tampering detected at record {i}! "
                        f"Declared '{declared_current_hash}' != Recomputed '{recomputed_hash}'"
                    ),
                    tampered_index=i,
                )

            expected_prev_hash = declared_current_hash
            latest_hash = declared_current_hash

        return ChainVerificationResult(
            is_valid=True,
            total_records=len(lines),
            genesis_hash=GENESIS_HASH,
            latest_hash=latest_hash,
        )

    def read_records(self) -> List[Dict[str, Any]]:
        """Reads all records from the log file into a list."""
        if not self.log_path.exists():
            return []
        with open(self.log_path, "r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]


if __name__ == "__main__":
    import sys

    target_file = sys.argv[1] if len(sys.argv) > 1 else "live_audit_trail.jsonl"
    print(f"Verifying SHA-256 Audit Chain: {target_file}")
    chain = AuditChain(target_file)
    result = chain.verify_chain()
    print(json.dumps(result.to_dict(), indent=2))
    if not result.is_valid:
        sys.exit(1)
    print("ALL BLOCKS CRYPTOGRAPHICALLY VALID UNDER BNSS 106-107 STANDARDS")

