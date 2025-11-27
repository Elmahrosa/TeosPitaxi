import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              TeosPiTaxi is committed to protecting your privacy. As a blockchain-based platform built on the Pi
              Network, we leverage decentralized technology to minimize data collection while ensuring transparent,
              secure transactions. This Privacy Policy explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Pi Network Authentication</h3>
            <p>When you sign in with Pi Network, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Pi username and unique ID</li>
              <li>Pi wallet address (for payments)</li>
              <li>Authentication tokens</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Profile Information</h3>
            <p>To create your TeosPiTaxi account, you provide:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Name and profile photo</li>
              <li>Phone number for trip coordination</li>
              <li>User type (Rider, Driver, or Agent)</li>
              <li>Vehicle details (drivers only): make, model, year, size category</li>
              <li>Driver license information (drivers only)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Trip Data</h3>
            <p>During each trip, we record:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Pickup and destination locations</li>
              <li>Trip duration and distance</li>
              <li>Fare amount in Pi</li>
              <li>Trip status and completion time</li>
              <li>Ratings and reviews</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Payment Information</h3>
            <p>All payment data is stored on the Pi blockchain:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Transaction IDs and amounts</li>
              <li>Escrow status and releases</li>
              <li>Treasury and driver payouts</li>
              <li>Payment timestamps</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Device Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Device type and operating system</li>
              <li>IP address and browser type</li>
              <li>Location data (with your permission)</li>
              <li>App usage analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Facilitate ride bookings between riders and drivers</li>
              <li>Process Pi cryptocurrency payments via blockchain escrow</li>
              <li>Calculate transparent fares based on distance and pricing configs</li>
              <li>Enable communication between riders and drivers</li>
              <li>Verify driver qualifications and vehicle requirements</li>
              <li>Resolve disputes through blockchain transaction records</li>
              <li>Improve platform performance and user experience</li>
              <li>Comply with legal obligations and safety requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Blockchain & Data Transparency</h2>
            <p>TeosPiTaxi leverages blockchain technology for maximum transparency:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>All payments are recorded on the Pi blockchain (immutable and public)</li>
              <li>Transaction histories are auditable by users</li>
              <li>Escrow splits (10% Treasury, 5% Agent, 85% Driver) are transparent</li>
              <li>Personal information is NOT stored on the blockchain</li>
              <li>Only transaction amounts and wallet addresses appear on-chain</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing & Disclosure</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 With Other Users</h3>
            <p>We share limited information for trip coordination:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Riders see driver name, photo, vehicle details, and rating</li>
              <li>Drivers see rider name, photo, pickup location, and rating</li>
              <li>Contact information shared only during active trips</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 With Service Providers</h3>
            <p>We work with trusted partners:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Pi Network for authentication and payments</li>
              <li>Supabase for secure database hosting</li>
              <li>Vercel for application hosting and CDN</li>
              <li>Map providers for location services</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Legal Requirements</h3>
            <p>We may disclose information when required by law or to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Comply with legal processes or government requests</li>
              <li>Protect safety of users or the public</li>
              <li>Investigate fraud or security issues</li>
              <li>Enforce our Terms of Service</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Elmahrosa Projects</h3>
            <p>
              As part of the Elmahrosa community, aggregated, anonymized data may be shared for civic governance and
              platform improvement initiatives. Personal information is never shared without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Secure database with row-level security policies</li>
              <li>Regular security audits and penetration testing</li>
              <li>Limited employee access to personal data</li>
              <li>Pi Network's blockchain security for payments</li>
              <li>Two-factor authentication options</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights & Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Access your personal data stored in our system</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your account (subject to legal retention)</li>
              <li>Opt out of promotional communications</li>
              <li>Disable location services (may limit functionality)</li>
              <li>Export your trip history and payment records</li>
              <li>Lodge complaints with data protection authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Retention</h2>
            <p>We retain your information as follows:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Active account data: Duration of account plus 7 years (legal requirement)</li>
              <li>Trip records: 7 years for tax and legal compliance</li>
              <li>Payment transactions: Permanent (stored on Pi blockchain)</li>
              <li>Chat messages: 90 days after trip completion</li>
              <li>Deleted account data: Anonymized after 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
            <p>
              TeosPiTaxi is not intended for users under 18 years old. We do not knowingly collect information from
              children. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. International Data Transfers</h2>
            <p>
              TeosPiTaxi operates primarily in Egypt and MENA regions. Your data may be processed in countries with
              different privacy laws. We ensure adequate safeguards are in place for international transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy to reflect platform changes or legal requirements. Material changes will
              be communicated via email or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
            <p>For privacy questions or to exercise your rights:</p>
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
                <strong>Data Protection Officer:</strong> Available through WhatsApp channel
              </li>
            </ul>
          </section>

          <section className="bg-muted p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4">Blockchain Privacy Note</h2>
            <p>
              Remember: Payment transactions on the Pi blockchain are public and permanent. While your personal identity
              is not revealed on-chain, transaction amounts and wallet addresses are visible to anyone. This
              transparency is a core feature of blockchain technology and ensures platform accountability.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
