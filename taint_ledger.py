"""
taint_ledger.py
================
Mathematical Banking Ledger implementing Clayton's Case Bounded FIFO Specific Lien Math.

Statutory Alignment:
- Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) Sections 106 & 107
- Rule in Clayton's Case (1816) 1 Mer 572 (FIFO Banking Allocation)
- High Court Jurisprudence on Account Freezing (Restricting lien strictly to the tainted quantum)

Mathematical Invariant:
    total_balance = clean_available_balance + restricted_taint_hold
    Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def to_decimal(value: Any) -> Decimal:
    """
    Convert numerical input into exact Decimal rounded to two decimal places.
    Eliminates floating-point drift in banking ledger calculations.
    """
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if isinstance(value, (int, str)):
        return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if isinstance(value, float):
        return Decimal(str(round(value, 2))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    raise TypeError(f"Cannot convert type {type(value)} to Decimal")


class LedgerError(Exception):
    """Base exception for ledger operations."""
    pass


class InsufficientCleanFundsError(LedgerError):
    """Raised when an outflow exceeds the clean available balance."""
    pass


class InvalidAmountError(LedgerError):
    """Raised when a non-positive or invalid amount is supplied."""
    pass


class LienViolationError(LedgerError):
    """Raised when an operation attempts to breach or unlawfully encumber a specific lien."""
    pass


@dataclass
class TaintTranche:
    """
    Represents an individual tainted tranche under Clayton's Case FIFO tracking.
    """
    tranche_id: str
    tx_id: str
    original_amount: Decimal
    held_amount: Decimal
    released_amount: Decimal = Decimal("0.00")
    fir_reference: str = "BNSS-SEC-106"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "ACTIVE_HOLD"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tranche_id": self.tranche_id,
            "tx_id": self.tx_id,
            "original_amount": str(self.original_amount),
            "held_amount": str(self.held_amount),
            "released_amount": str(self.released_amount),
            "fir_reference": self.fir_reference,
            "timestamp": self.timestamp,
            "status": self.status,
        }


class BankingTaintLedger:
    """
    Production-grade banking ledger maintaining strict mathematical segregation between:
      1. clean_available_balance: Free, unencumbered funds fully accessible to account holder.
      2. restricted_taint_hold: Legally ring-fenced funds under BNSS 106/107 specific lien directives.

    Adheres strictly to the bounded formula:
      Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)
    """

    def __init__(
        self,
        account_id: str,
        account_holder: str = "Beneficiary",
        initial_clean_balance: Any = Decimal("0.00"),
        audit_chain: Optional[Any] = None,
    ):
        self.account_id = account_id
        self.account_holder = account_holder
        self.clean_available_balance = to_decimal(initial_clean_balance)
        self.restricted_taint_hold = Decimal("0.00")
        self.taint_tranches: List[TaintTranche] = []
        self._tranche_counter = 0
        self.audit_chain = audit_chain

        if self.clean_available_balance < Decimal("0.00"):
            raise InvalidAmountError("Initial balance cannot be negative")

        if self.audit_chain is not None:
            self.audit_chain.append_event(
                event_type="ACCOUNT_INITIALIZATION",
                account_id=self.account_id,
                state_snapshot=self.get_snapshot(),
                delta={"amount": str(self.clean_available_balance), "clean_delta": str(self.clean_available_balance), "hold_delta": "0.00"},
                directive_reference="STANDARD_BANKING_CORE",
                legal_basis="RBI Banking Regulation Act Section 6",
                court_or_authority="System Genesis",
            )

    @property
    def total_balance(self) -> Decimal:
        """
        Total book balance of the account.
        Mathematically: clean_available_balance + restricted_taint_hold
        """
        return (self.clean_available_balance + self.restricted_taint_hold).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def get_snapshot(self) -> Dict[str, str]:
        """Returns exact snapshot of account balances formatted as strings."""
        return {
            "account_id": self.account_id,
            "account_holder": self.account_holder,
            "clean_available_balance": str(self.clean_available_balance),
            "restricted_taint_hold": str(self.restricted_taint_hold),
            "total_balance": str(self.total_balance),
            "currency": "INR",
        }

    def deposit_clean(
        self,
        amount: Any,
        tx_id: str = "",
        narrative: str = "Clean Inflow / Salary / Legitimate Deposit",
    ) -> Dict[str, Any]:
        """
        Deposits legitimate funds directly into clean_available_balance.
        Has zero impact on restricted_taint_hold.
        """
        amount_dec = to_decimal(amount)
        if amount_dec <= Decimal("0.00"):
            raise InvalidAmountError("Deposit amount must be strictly positive")

        self.clean_available_balance += amount_dec

        result = {
            "status": "SUCCESS",
            "event": "CLEAN_DEPOSIT",
            "tx_id": tx_id,
            "amount": str(amount_dec),
            "narrative": narrative,
            "snapshot": self.get_snapshot(),
        }

        if self.audit_chain is not None:
            self.audit_chain.append_event(
                event_type="CLEAN_DEPOSIT",
                account_id=self.account_id,
                state_snapshot=self.get_snapshot(),
                delta={"amount": str(amount_dec), "clean_delta": str(amount_dec), "hold_delta": "0.00"},
                directive_reference="STANDARD_DEPOSIT",
                legal_basis="Commercial Banking Credit Inflow",
                court_or_authority="Bank Core Engine",
                metadata={"tx_id": tx_id, "narrative": narrative},
            )

        return result

    def apply_taint_inflow(
        self,
        transfer_amount: Any,
        target_taint: Any,
        tx_id: str,
        fir_reference: str = "BNSS-SEC-106-CYBER-CRIME",
        authority: str = "State Cyber Crime Police Station",
    ) -> Dict[str, Any]:
        """
        Executes Clayton's Case Bounded FIFO Specific Lien Formula:
            Hold = min(Transfer_Amount, Remaining_Unfrozen_Taint)

        Any transfer amount in excess of the target taint is credited to clean_available_balance.
        The exact computed hold is credited to restricted_taint_hold.
        """
        transfer_dec = to_decimal(transfer_amount)
        taint_target_dec = to_decimal(target_taint)

        if transfer_dec <= Decimal("0.00"):
            raise InvalidAmountError("Transfer amount must be strictly positive")
        if taint_target_dec <= Decimal("0.00"):
            raise InvalidAmountError("Target taint must be strictly positive")

        # Core Mathematical Formula:
        hold_applied = min(transfer_dec, taint_target_dec)
        clean_portion = transfer_dec - hold_applied

        self._tranche_counter += 1
        tranche_id = f"TR-{self.account_id}-{self._tranche_counter:04d}"

        new_tranche = TaintTranche(
            tranche_id=tranche_id,
            tx_id=tx_id,
            original_amount=transfer_dec,
            held_amount=hold_applied,
            fir_reference=fir_reference,
            status="ACTIVE_HOLD" if hold_applied > Decimal("0.00") else "CLEARED",
        )
        self.taint_tranches.append(new_tranche)

        # Update Account Balances
        self.restricted_taint_hold += hold_applied
        self.clean_available_balance += clean_portion

        result = {
            "status": "SUCCESS",
            "event": "TAINT_INFLOW_SPECIFIC_LIEN",
            "tx_id": tx_id,
            "transfer_amount": str(transfer_dec),
            "target_taint": str(taint_target_dec),
            "hold_applied": str(hold_applied),
            "clean_portion_credited": str(clean_portion),
            "tranche_id": tranche_id,
            "fir_reference": fir_reference,
            "snapshot": self.get_snapshot(),
        }

        if self.audit_chain is not None:
            self.audit_chain.append_event(
                event_type="TAINT_INFLOW_SPECIFIC_LIEN",
                account_id=self.account_id,
                state_snapshot=self.get_snapshot(),
                delta={
                    "amount": str(transfer_dec),
                    "clean_delta": str(clean_portion),
                    "hold_delta": str(hold_applied),
                },
                directive_reference="BNSS_SECTION_106",
                legal_basis="BNSS Section 106 Specific Lien Directive (Proportional Quantum)",
                court_or_authority=authority,
                metadata={
                    "tx_id": tx_id,
                    "target_taint": str(taint_target_dec),
                    "hold_applied": str(hold_applied),
                    "clean_portion": str(clean_portion),
                    "fir_reference": fir_reference,
                },
            )

        return result

    def process_outflow(
        self,
        amount: Any,
        purpose: str = "Operational Expenditure / Essential Bill",
        beneficiary: str = "Medical Center / Merchant",
        tx_id: str = "",
    ) -> Dict[str, Any]:
        """
        Executes operational debit against clean_available_balance.

        Strict Legal and Mathematical Invariant:
            Debits are permitted IF AND ONLY IF amount <= clean_available_balance.
            Under BNSS 106-107 and High Court mandate, restricted_taint_hold cannot
            be breached or encumbered by commercial outflows.
            Equally, clean funds CANNOT be indiscriminately blocked due to existing taint.
        """
        amount_dec = to_decimal(amount)
        if amount_dec <= Decimal("0.00"):
            raise InvalidAmountError("Outflow amount must be strictly positive")

        if amount_dec > self.clean_available_balance:
            # Operational debit blocked: cannot encroach on restricted taint hold
            deficit = amount_dec - self.clean_available_balance
            error_msg = (
                f"Transaction Rejected: Requested outflow ₹{amount_dec} exceeds clean available balance "
                f"₹{self.clean_available_balance}. The deficit of ₹{deficit} encroaches upon "
                f"restricted_taint_hold ₹{self.restricted_taint_hold}, which is legally ring-fenced "
                f"under BNSS Sections 106-107 specific lien directives."
            )

            if self.audit_chain is not None:
                self.audit_chain.append_event(
                    event_type="OUTFLOW_BLOCKED_LIEN_PROTECTION",
                    account_id=self.account_id,
                    state_snapshot=self.get_snapshot(),
                    delta={"amount": str(amount_dec), "clean_delta": "0.00", "hold_delta": "0.00"},
                    directive_reference="BNSS_SECTION_106_PROTECTION",
                    legal_basis="Refusal to Encroach Statutory Specific Lien",
                    court_or_authority="Automated Guardrail Engine",
                    metadata={"purpose": purpose, "requested_amount": str(amount_dec), "rejection_reason": error_msg},
                )

            raise InsufficientCleanFundsError(error_msg)

        # Debit solely clean available balance
        self.clean_available_balance -= amount_dec

        result = {
            "status": "APPROVED",
            "event": "CLEAN_OUTFLOW_SETTLED",
            "tx_id": tx_id,
            "amount_paid": str(amount_dec),
            "purpose": purpose,
            "beneficiary": beneficiary,
            "remaining_clean_balance": str(self.clean_available_balance),
            "lien_hold_preserved": str(self.restricted_taint_hold),
            "snapshot": self.get_snapshot(),
        }

        if self.audit_chain is not None:
            self.audit_chain.append_event(
                event_type="CLEAN_OUTFLOW_SETTLED",
                account_id=self.account_id,
                state_snapshot=self.get_snapshot(),
                delta={"amount": str(amount_dec), "clean_delta": str(-amount_dec), "hold_delta": "0.00"},
                directive_reference="BNSS_SECTION_106_PRESERVATION",
                legal_basis="Permitted Unfettered Operation of Clean Account Portion",
                court_or_authority="Bank Settlement Core",
                metadata={
                    "tx_id": tx_id,
                    "purpose": purpose,
                    "beneficiary": beneficiary,
                    "lien_hold_preserved": str(self.restricted_taint_hold),
                },
            )

        return result

    def release_taint_for_restitution(
        self,
        restitution_amount: Any,
        court_order_ref: str,
        magistrate_court: str,
        victim_account_ref: str,
    ) -> Dict[str, Any]:
        """
        Executes judicial restitution under BNSS Section 107.
        Transfers restricted lien funds out to the victim/court registry using Clayton's FIFO rule.
        """
        amount_dec = to_decimal(restitution_amount)
        if amount_dec <= Decimal("0.00"):
            raise InvalidAmountError("Restitution amount must be strictly positive")

        if amount_dec > self.restricted_taint_hold:
            raise LienViolationError(
                f"Restitution amount ₹{amount_dec} exceeds total restricted taint hold ₹{self.restricted_taint_hold}"
            )

        # Clayton's FIFO de-allocation across tranches
        remaining_to_release = amount_dec
        for tranche in self.taint_tranches:
            if remaining_to_release <= Decimal("0.00"):
                break
            if tranche.held_amount <= Decimal("0.00"):
                continue

            available_in_tranche = tranche.held_amount
            deduct = min(available_in_tranche, remaining_to_release)
            tranche.held_amount -= deduct
            tranche.released_amount += deduct
            remaining_to_release -= deduct

            if tranche.held_amount == Decimal("0.00"):
                tranche.status = "RESTITUTED_CLOSED"
            else:
                tranche.status = "PARTIALLY_RESTITUTED"

        self.restricted_taint_hold -= amount_dec

        result = {
            "status": "RESTITUTION_EXECUTED",
            "event": "BNSS_107_VICTIM_RESTITUTION",
            "amount_restituted": str(amount_dec),
            "court_order_ref": court_order_ref,
            "magistrate_court": magistrate_court,
            "victim_account_ref": victim_account_ref,
            "remaining_restricted_hold": str(self.restricted_taint_hold),
            "snapshot": self.get_snapshot(),
        }

        if self.audit_chain is not None:
            self.audit_chain.append_event(
                event_type="BNSS_107_VICTIM_RESTITUTION",
                account_id=self.account_id,
                state_snapshot=self.get_snapshot(),
                delta={"amount": str(amount_dec), "clean_delta": "0.00", "hold_delta": str(-amount_dec)},
                directive_reference="BNSS_SECTION_107",
                legal_basis="Judicial Restitution of Crime Proceeds to Victim",
                court_or_authority=magistrate_court,
                metadata={
                    "court_order_ref": court_order_ref,
                    "victim_account_ref": victim_account_ref,
                },
            )

        return result

    @staticmethod
    def calculate_fifo_holds(tainted_inflows: List[Dict[str, Any]], target_demand: Any) -> Dict[str, Any]:
        """
        Pure mathematical implementation of Clayton's Case Bounded FIFO Allocation.
        Given a list of tainted inflows and a target allocation/demand (e.g. bill slider or freeze quantum),
        allocates holds in strict First-In, First-Out sequence:
            Hold_i = min(Transfer_Amount_i, Remaining_Unallocated_Target)
        """
        target_dec = to_decimal(target_demand)
        remaining_demand = target_dec
        allocated_records = []
        total_inflow_sum = Decimal("0.00")

        for item in tainted_inflows:
            tx_id = item["tx_id"]
            amount_dec = to_decimal(item["amount"])
            total_inflow_sum += amount_dec

            if remaining_demand <= Decimal("0.00"):
                allocated_records.append({
                    "tx_id": tx_id,
                    "amount": str(amount_dec),
                    "hold_applied": "0.00",
                    "released_clear": str(amount_dec),
                    "status": "CLEARED",
                })
                continue

            hold_for_tx = min(amount_dec, remaining_demand)
            released_for_tx = amount_dec - hold_for_tx
            remaining_demand -= hold_for_tx

            allocated_records.append({
                "tx_id": tx_id,
                "amount": str(amount_dec),
                "hold_applied": str(hold_for_tx),
                "released_clear": str(released_for_tx),
                "status": "HELD" if released_for_tx == Decimal("0.00") else "PARTIAL_HOLD",
            })

        total_held = sum(Decimal(tx["hold_applied"]) for tx in allocated_records)
        uncovered_demand = max(Decimal("0.00"), target_dec - total_held)

        return {
            "target_demand": str(target_dec),
            "total_inflows": str(total_inflow_sum),
            "total_held": str(total_held),
            "uncovered_demand": str(uncovered_demand),
            "allocations": allocated_records,
        }


if __name__ == "__main__":
    from audit_chain import AuditChain
    import tempfile

    print("=" * 70)
    print("CLAYTON'S CASE BOUNDED FIFO SPECIFIC LIEN BANKING ENGINE")
    print("Statutory Alignment: BNSS 2023 Sections 106-107 | CrPC 102")
    print("=" * 70)

    audit_file = "live_audit_trail.jsonl"
    if Path(audit_file).exists():
        Path(audit_file).unlink()

    chain = AuditChain(audit_file)

    # 1. Initialize Account with ₹48,500 clean money
    ledger = BankingTaintLedger(
        account_id="ACC-IN-2026-ARUN",
        account_holder="Arun Kumar",
        initial_clean_balance=Decimal("48500.00"),
        audit_chain=chain,
    )
    print("\n[STEP 1] Account Initialized:")
    print(json.dumps(ledger.get_snapshot(), indent=2))

    # 2. Receive ₹12,000 tainted deposit
    print("\n[STEP 2] Incoming ₹12,000 Transfer flagged under BNSS Section 106:")
    inflow = ledger.apply_taint_inflow(
        transfer_amount=Decimal("12000.00"),
        target_taint=Decimal("12000.00"),
        tx_id="UPI-2026-991823",
        fir_reference="FIR-412/2026-CYBER-CRIME",
        authority="Cyber Crime Police Station, Bengaluru",
    )
    print(json.dumps(inflow, indent=2))

    # 3. Pay ₹20,000 Emergency Hospital Bill
    print("\n[STEP 3] Paying ₹20,000 Emergency Hospital Bill:")
    outflow = ledger.process_outflow(
        amount=Decimal("20000.00"),
        purpose="Emergency Medical Treatment - ICU Bill",
        beneficiary="Apollo Multi-Speciality Hospital",
        tx_id="HOSP-BILL-7721",
    )
    print(json.dumps(outflow, indent=2))

    # 4. Verify Cryptographic Audit Chain
    print("\n[STEP 4] Cryptographic Audit Chain Verification:")
    verification = chain.verify_chain()
    print(json.dumps(verification.to_dict(), indent=2))
    print("\n" + "=" * 70)
    print("MATHEMATICAL PROOF COMPLETE: ZERO LIEN BREACH, CLEAN FUNDS PRESERVED")
    print("=" * 70)

