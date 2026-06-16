import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background text-foreground py-16 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: June 2026</p>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-medium mb-3">1. Information We Collect</h2>
            <p>We collect essential information to provide our services, including Google OAuth profiles and email addresses for authentication and communication purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">2. Data Encryption & Storage</h2>
            <p>All data is secured using Supabase encrypted connection strings. We implement end-to-end data sandboxing to ensure your information remains isolated and protected at rest and in transit.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">3. Indian Data Localization Compliance</h2>
            <p>We adhere strictly to RBI framework data privacy metrics, ensuring localized data handling and compliance for our Indian customer base.</p>
          </section>

          <section>
            <h2 className="text-2xl font-medium mb-3">4. Contact Us</h2>
            <p>For any privacy-related inquiries, please contact our support team at <a href="mailto:support@yourdomain.com" className="text-primary hover:underline">support@yourdomain.com</a>.</p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
