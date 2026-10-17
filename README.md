CHRONOS-Z: Autonomous Mule Ring Interdiction & Tamper-Evident Cyber-Banking Core

Built for the **IBM Z Datathon 2026** by Team Two Bugs and a Byte (MCET).



 📌 Overview

CHRONOS-Z is an enterprise-grade financial fraud prevention and autonomous lien-tracing platform engineered for high-throughput execution environments like **IBM LinuxONE (`s390x`)**.

Traditional anti-fraud systems rely on blunt, blanket account freezes that cause severe operational friction, locking legitimate life savings during investigations. CHRONOS-Z introduces **Bounded FIFO Specific Liens**, isolating tainted fraud proceeds mathematically across complex multi-hop mule networks while keeping legitimate funds fully accessible. Every intervention is backed by sub-millisecond on-device ONNX inference and an immutable SHA-256 audit log compliant with **Bharatiya Nagarik Suraksha Sanhita (BNSS) Sections 106–107**.


⚡ Key Architectural Pillars

1. Ultra-Low Latency ML Inference (IBM LinuxONE `s390x`)

Model: 3-layer deep Multilayer Perceptron (MLP) trained in PyTorch and exported to **ONNX (opset 17)**.
Latency:Sub-millisecond ($<1\text{ ms}$) execution path optimized for mainframe architectures without heavy GPU or runtime dependencies.
Telemetry Vector: Evaluates transaction velocity, recipient account age, behavioral hesitation, and on-device coercion call flags in real time.

2. Bounded FIFO Specific Lien Engine

Eliminates collateral damage from blanket account freezes by computing specific mathematical hold amounts across transaction hops:

$$\text{Hold} = \min(\text{Transfer\_Amount},\; \text{Remaining\_Unfrozen\_Taint})$$


* Preserves legitimate capital (e.g., medical emergency reserves or salary balances) while strictly containing illicit money-mule spillover.

 3. Tamper-Evident Cryptographic Ledger (BNSS Sec 106–107)

* Continuous cryptographic ledger recording each state change into an append-only JSONL format (`audit_chain.py`).
* Each entry computes:

$$\text{Current\_Hash} = \text{SHA256}(\text{Index} \parallel \text{Timestamp} \parallel \text{Payload} \parallel \text{Previous\_Hash})$$


* Provides zero-knowledge court-admissible audit trails for law enforcement and judicial authorities.


 🏗️ System Architecture

```text
[ Mobile / Web Client ] (Next.js 14 + Tailwind CSS)
           │
           ▼
[ Cloudflare Tunnel / HTTP2 Edge ]
           │
           ▼
[ FastAPI High-Concurrency Core ] (IBM LinuxONE / s390x)
   ├── /score            ──▶ [ ONNX Runtime: Mule Detection (<1ms) ]
   ├── /taint/transfer   ──▶ [ Bounded FIFO Lien Isolation Engine ]
   └── /audit/verify     ──▶ [ SHA-256 Hash Chain (BNSS 106-107) ]
           │
           ▼
[ Tamper-Evident Ledgers ] (chronos_transaction_ledger.jsonl)





 📂 Repository Structure

```text
CHRONOS-Z/
├── frontend/                     # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                  # App router (/pay, /dashboard, /login)
│   │   ├── components/           # UI components & War-Room dashboard
│   │   └── lib/                  # API client and state management (Zustand)
│   ├── package.json              # Frontend dependencies
│   └── tailwind.config.js        # Design styling
├── ml_pipeline/                  # Machine Learning Training Pipeline
│   ├── train_chronos.ipynb       # PyTorch MLP training, evaluation & ONNX export
│   └── train_chronos.py          # Standalone training script
├── chronos_mule_model.onnx       # Exported ONNX opset 17 model artifact
├── main.py                       # FastAPI core server & endpoint routing
├── taint_ledger.py               # Bounded FIFO Specific Lien math implementation
├── audit_chain.py                # Cryptographic SHA-256 chaining engine
├── auth_security.py              # Zero-Trust JWT & Role-Based Access Control
├── chronos_transaction_ledger.jsonl # Active transaction record store
├── live_audit_trail.jsonl        # Cryptographic chain entries
├── requirements.txt              # Backend dependencies
└── README.md                     # Project documentation


 🚀 Getting Started

### Prerequisites

* Python 3.10+
* Node.js 18+ and `npm`
* Git

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/gokulkrishnan2949888-bit/chronos-z.git
cd chronos-z

# Install Python dependencies
pip install fastapi uvicorn onnxruntime numpy pydantic

# Launch the FastAPI Core
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

```

Interactive Swagger API Documentation: `http://localhost:8000/docs`

2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the Next.js development server
npm run dev

```

* UPI Payment Simulation Terminal: `http://localhost:3000/pay`
* Investigator War-Room & Lien Resolution: `http://localhost:3000/dashboard`



 👥 Team: Two Bugs and a Byte

* **Institution:** Dr. Mahalingam College of Engineering and Technology (MCET)
* **Datathon:** IBM Z Datathon 2026
