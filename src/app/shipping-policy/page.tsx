export const metadata = {
  title: "Shipping Policy — Crochett & Co",
  description: "Learn about shipping times, delivery rates, and processing periods for our handmade crochet products.",
};

export default function ShippingPolicy() {
  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <article className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Shipping Policy
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Last Updated: June 2026
        </p>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
          <p>
            Thank you for visiting and shopping at Crochett & Co. The following terms constitute our Shipping Policy.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            1. Crafting and Processing Lead Times
          </h2>
          <p>
            Because every single product is handmade with love and care, order processing is divided into two phases:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Products:</strong> Handcrafted and ready to ship within 3-5 business days.</li>
            <li><strong>Custom Orders and Bouquets:</strong> Handcrafted and ready to ship within 7-14 business days, depending on composition and volume.</li>
          </ul>
          <p>
            Orders are not crafted or shipped on Sundays or public holidays.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            2. Shipping Rates and Delivery Estimates
          </h2>
          <p>
            We offer shipping across India. Shipping charges for your order will be calculated and displayed at checkout:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Orders above ₹999:</strong> Free Shipping</li>
            <li><strong>Orders below ₹999:</strong> Flat ₹49 shipping fee</li>
          </ul>
          <p>
            Once shipped, transit typically takes 2-5 business days depending on your location and distance from our studio.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            3. Delivery Address and Shipment Confirmation
          </h2>
          <p>
            You will receive a shipment confirmation email or WhatsApp notification containing tracking numbers once your order has shipped. Please ensure the delivery address, contact number, and name are accurate, as we cannot redirect packages once in transit.
          </p>
        </div>
      </article>
    </main>
  );
}
