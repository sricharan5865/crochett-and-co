export const metadata = {
  title: "Terms & Conditions — Crochett & Co",
  description: "Terms and conditions for buying and ordering custom handmade products from Crochett & Co.",
};

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <article className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Terms & Conditions
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Last Updated: June 2026
        </p>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
          <p>
            Welcome to Crochett & Co. These terms and conditions outline the rules and regulations for the use of Crochett & Co&apos;s Website and our handcrafted services.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            1. Handmade Nature of Products
          </h2>
          <p>
            All of our products are 100% handmade, one stitch at a time. Due to this handcrafted nature, minor variations in size, color layout, and stitching are expected and celebrated as part of the unique character of each piece.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            2. Orders and Cancellations
          </h2>
          <p>
            Orders are confirmed once payment is processed or finalized via WhatsApp. Because materials are allocated and crafting begins promptly, orders can only be cancelled within 24 hours of placement. No cancellations will be accepted after 24 hours.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            3. Custom Orders
          </h2>
          <p>
            Custom order specifications (color choice, flower selection, design shape) must be final before production begins. We are not responsible for errors resulting from incorrect details provided by the customer during checkout or on WhatsApp.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            4. Pricing and Payments
          </h2>
          <p>
            All prices are in Indian Rupees (INR) and are inclusive of GST where applicable. Delivery charges are calculated at checkout. We reserve the right to alter pricing for custom requests based on complexity and materials required.
          </p>
        </div>
      </article>
    </main>
  );
}
