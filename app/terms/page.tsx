import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to TeosPiTaxi. By accessing or using our Pi-powered mobility platform, you agree to be bound by
              these Terms of Service. TeosPiTaxi is the first blockchain-based ride-sharing service on the Pi Network,
              offering transparent, civic-first transportation services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Elmahrosa Projects Partnership</h2>
            <p>
              TeosPiTaxi is an official partner of Elmahrosa Projects. All users and drivers join the Elmahrosa
              community and contribute to civic-first governance and transparent mobility services in Egypt and beyond.
            </p>
            <p className="mt-4">By using TeosPiTaxi, you agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Participate in the Elmahrosa community with integrity</li>
              <li>Support transparent, blockchain-verified transactions</li>
              <li>Contribute to civic-first governance principles</li>
              <li>Uphold Egyptian heritage and cultural values</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <p>
              To use TeosPiTaxi, you must create a profile linked to your Pi Network account. You are responsible for
              maintaining the confidentiality of your Pi wallet credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Driver Requirements</h2>
            <p>All drivers must meet the following requirements:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Valid driver's license for the service area</li>
              <li>Vehicle manufactured 2020 or later</li>
              <li>Vehicle must be registered as small car, large car, or bike</li>
              <li>Proof of vehicle insurance</li>
              <li>Background check clearance</li>
              <li>Signed patent agreement for TeosPiTaxi platform</li>
              <li>Complete profile verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Payment Terms</h2>
            <p>
              All payments are processed through the Pi Network blockchain. TeosPiTaxi uses an escrow system to ensure
              secure transactions:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Riders pay in Pi cryptocurrency at booking</li>
              <li>Funds are held in blockchain escrow until trip completion</li>
              <li>Platform fee (10%) goes to TEOS Treasury for civic projects</li>
              <li>Agent commission (5%) for referrals when applicable</li>
              <li>Driver earnings (85%) released after successful trip completion</li>
              <li>Disputes handled through transparent blockchain records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cancellation & Refund Policy</h2>
            <p>
              Cancellations before driver acceptance: Full refund. Cancellations after driver arrives: Cancellation fee
              may apply. Emergency cancellations reviewed case-by-case by admin team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Dispute Resolution</h2>
            <p>
              All disputes are handled through our transparent governance system. Blockchain transaction records provide
              immutable evidence. Admin team reviews disputes within 24 hours. Appeals can be escalated to community
              governance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Safety & Conduct</h2>
            <p>Users must:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Treat all parties with respect and dignity</li>
              <li>Follow local traffic laws and regulations</li>
              <li>Not use platform for illegal activities</li>
              <li>Report safety concerns immediately</li>
              <li>Maintain accurate profile information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Platform Fees</h2>
            <p>
              The 10% platform fee supports TEOS Treasury initiatives including civic infrastructure, community
              development, and platform maintenance. All fee allocations are transparent and auditable on the
              blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Intellectual Property</h2>
            <p>
              TeosPiTaxi, its logo, and all related intellectual property are owned by Elmahrosa Projects. All drivers
              and agents must sign a patent agreement acknowledging platform ownership and usage rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Liability Limitation</h2>
            <p>
              TeosPiTaxi connects riders with independent drivers. We are not liable for driver actions, vehicle
              condition, or incidents during trips. Users agree to resolve disputes with drivers directly or through our
              dispute resolution system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Termination</h2>
            <p>
              We reserve the right to terminate accounts for violation of terms, fraudulent activity, or behavior
              harmful to the community. Terminated users forfeit pending earnings and may be banned from the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Changes to Terms</h2>
            <p>
              We may update these terms to reflect platform improvements or regulatory requirements. Continued use after
              changes constitutes acceptance of new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
            <p>For questions or concerns about these terms:</p>
            <ul className="list-none space-y-2 mt-4">
              <li>
                <strong>WhatsApp Community:</strong>{" "}
                <a
                  href="https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u"
                  className="text-primary hover:underline"
                >
                  Join Channel
                </a>
              </li>
              <li>
                <strong>Website:</strong> TeosPiTaxi.teosegypt.com
              </li>
              <li>
                <strong>Founder:</strong> aams1969 (Pi Network)
              </li>
            </ul>
          </section>

          <section className="bg-muted p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptance</h2>
            <p>
              By creating a TeosPiTaxi account, you acknowledge that you have read, understood, and agree to be bound by
              these Terms of Service and our Privacy Policy. You also agree to join the Elmahrosa Projects community and
              sign the required patent agreement.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
