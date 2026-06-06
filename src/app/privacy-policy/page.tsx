export const metadata = {
  title: "Privacy Policy — Crochett & Co",
  description: "Learn about how Crochett & Co collects, uses, and safeguards your personal data.",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <article className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Last Updated: June 2026
        </p>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
          <p>
            At Crochett & Co, accessible from @crochett.and.co on Instagram and our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Crochett & Co and how we use it.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            1. Information We Collect
          </h2>
          <p>
            We collect personal information that you provide to us directly when placing an order, designing bouquets, or communicating with us. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name and Contact Information (Email Address, Phone Number)</li>
            <li>Delivery and Billing Address</li>
            <li>WhatsApp details if you choose to order through WhatsApp</li>
            <li>Custom design requests, notes, and reference images</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process, fulfill, and ship your orders</li>
            <li>Provide customer support, particularly through WhatsApp chat</li>
            <li>Send order confirmations and updates</li>
            <li>Optimize and improve our website and services</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            3. Data Protection and Storage
          </h2>
          <p>
            Your transaction data is processed securely via standard payment gateways (like UPI or Cards), and customer information is stored safely using our Firebase backend services. We do not sell, rent, or trade your personal information to third parties.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            4. Contact Us
          </h2>
          <p>
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at hello@crochettandco.com.
          </p>
        </div>
      </article>
    </main>
  );
}
