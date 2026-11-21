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
              Welcome to TeosPiTaxi. By accessing or using this Pi-powered mobility release candidate, you agree to be
              bound by these Terms of Service. The application is not launch-approved and is not represented as the
              first or only Pi Network ride-sharing service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Elmahrosa Projects Partnership</h2>
            <p>
              Repository materials associate TeosPiTaxi with Elmahrosa Projects and civic-first mobility principles.
              Formal partnership, governance, and constitution evidence remain owner-supplied and are not represented as
              verified in this release candidate.
            </p>
            <p className="mt-4">By using TeosPiTaxi, you agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Participate with integrity in any community program that is actually offered</li>
              <li>Support server-verified transaction records</li>
              <li>Respect civic-first governance principles when approved</li>
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
              <li>Requirements and evidence standards are pending owner approval</li>
              <li>Driver document submission is unavailable in this release candidate</li>
              <li>No document-approval success state is reachable</li>
              <li>Any governance or patent agreement terms remain owner-supplied</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Payment Terms</h2>
            <p>
              Pi payments are initiated through the Pi SDK and verified through a trusted server boundary. Payment and
              mutation routes fail closed until that boundary is configured:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>The browser amount only starts the Pi SDK; it never authorizes settlement</li>
              <li>The server verifies provider evidence before approval and completion</li>
              <li>Treasury receives 10%</li>
              <li>A qualified agent receives 5% only under the approved policy</li>
              <li>The driver receives 85% with a qualified agent, or 90% without one</li>
              <li>Settlement is recorded in a server ledger; automated payouts remain disabled</li>
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
              Dispute intake is unavailable in this release candidate. When trusted server data is connected, review
              evidence will be limited to server audit records and provider verification records. Review timelines and
              appeal routes are pending owner-defined policy and are not represented as already operating.
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
              The approved split is 10% treasury, 5% only to a qualified agent, and 85% driver with a qualified agent or
              90% driver without one. Amounts are derived in integer minor units by the server and recorded in a server
              ledger. No blockchain auditability or automatic payout claim is made.
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
            </ul>
          </section>

          <section className="bg-muted p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptance</h2>
            <p>
              By creating a TeosPiTaxi account, you acknowledge that you have read, understood, and agree to be bound by
              these Terms of Service and our Privacy Policy. Any community, governance, or patent-agreement requirement
              remains pending owner-supplied configuration and is not enforced by this release candidate.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
