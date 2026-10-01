# TeosPiTaxi - Pi Network Verification Document

## Project Summary for Pi Core Team

**Project Name:** TeosPiTaxi  
**Website:** https://TeosPiTaxi.teosegypt.com  
**Founder:** aams1969 (Pi Network)  
**Location:** Alexandria, Egypt (Initial Soft Launch)  
**Platform:** Next.js 15, React 19, TypeScript, Supabase, Pi Network SDK v2.0  

### Civic Utility Value
TeosPiTaxi provides transparent mobility services with the following civic benefits:

1. **Transparent Mobility** - All transactions recorded on Pi blockchain with public audit trails
2. **Escrow Protection** - Rider funds held in escrow until trip completion, preventing fraud
3. **Fair Payment Distribution** - Automatic 80%/15%/5% split (Driver/Treasury/Agent) ensures fair compensation
4. **Community Governance** - Transparent decision-making processes with community oversight
5. **Local Economic Empowerment** - Enables Alexandrian drivers to earn Pi cryptocurrency directly
6. **Reduced Financial Friction** - Instant blockchain settlement vs. traditional 3-5 day bank transfers
7. **Audit Trail Transparency** - Every transaction verifiable on Pi blockchain explorer

### Payment Flow Explanation

**Step-by-Step Transaction Process:**

1. **Rider Request** - User requests a ride through the TeosPiTaxi app
2. **Fare Calculation** - System calculates fare with potential surge pricing (displayed transparently)
3. **Escrow Funding** - Rider initiates Pi payment to fund escrow (Pioneer-to-App flow)
4. **Payment Approval** - Backend approves the payment via Pi SDK
5. **Escrow Holding** - Pi Network holds funds in escrow until trip completion
6. **Trip Completion** - Driver marks trip as completed in the app
7. **Payment Distribution** - System automatically distributes funds:
   - 80% → Driver (Server-to-User transfer via Pi SDK createTransfer)
   - 15% → TEOS Treasury (retained in founder's developer wallet: aams1969)
   - 5% → Referring Agent (if applicable, Server-to-User transfer)
8. **Confirmation** - All parties receive payment confirmation with transaction IDs

**Technical Implementation:**
- Uses official Pi Network SDK v2.0 for all cryptocurrency operations
- Server-side payment verification prevents client-side manipulation
- Escrow completion requires blockchain transaction verification
- All payment records stored in Supabase with references to Pi transaction IDs
- Real-time transparency dashboard displays anonymized transaction data

### Current Status
- **Mainnet Ready:** All Pi SDK integrations completed and tested
- **Soft Launch Phase:** Preparing for initial launch in Alexandria, Egypt
- **Testnet Testing:** Completed successfully with all payment flows verified
- **KYC Verification:** Founder account (aams1969) completed Pi KYC verification
- **Documentation:** All required documentation completed and available

### Founder Information
- **Pi Username:** aams1969
- **Role:** Founder and Principal Architect
- **Responsibility:** Platform governance, treasury management, and network liaison
- **Wallet:** aams1969 (used for TEOS Treasury receipts)

### Verification Readiness Checklist
- [x] App uses official Pi Network SDK v2.0
- [x] All transactions in Pi cryptocurrency only (no fiat)
- [x] Transparent fee structure documented and implemented
- [x] Escrow flow properly implemented with server-side validation
- [x] No external blockchain integrations
- [x] Privacy policy and terms of service completed
- [x] KYC verification completed for founder account
- [x] Testnet testing completed successfully
- [x] Clean repository with no committed secrets
- [x] App URL and Redirect URL configured in Pi Developer Portal
- [x] Transparent transaction records available via /transparency portal

### Submission Notes
This submission is for the TeosPiTaxi mobility platform, which is part of the Elmahrosa Projects ecosystem focused on civic-first blockchain solutions. The platform is designed to serve the Alexandria, Egypt community initially, with plans for expansion to other Egyptian cities following successful soft launch.

We welcome any feedback from the Pi Network team and are prepared to address any additional requirements to ensure full compliance with listing standards.

---
*Document Version: 1.0*  
*Last Updated: October 1, 2026*  
*For Pi Network Verification Submission*