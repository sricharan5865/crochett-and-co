export const metadata = {
  title: "Returns & Refund Policy — Crochett & Co",
  description: "Read about our return, exchange, and refund terms for handcrafted items.",
};

export default function ReturnsPolicy() {
  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <article className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Returns & Refund Policy
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Last Updated: June 2026
        </p>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
          <p>
            At Crochett & Co, we strive to craft products that bring joy and warmth. Please read our policy on returns and refunds carefully:
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            1. Non-Returnable Items
          </h2>
          <p>
            Due to the handcrafted, customized, and made-to-order nature of our items, we do not accept returns or offer refunds for change of mind or personal preference changes. Once an order is made and shipped, it is final.
          </p>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            2. Damaged or Defective Items
          </h2>
          <p>
            We take great care in packaging our products to ensure they arrive in perfect condition. In the rare event that your item is damaged during transit, or if there is a crafting defect:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Please contact us within 48 hours of delivery at hello@crochettandco.com or via WhatsApp.</li>
            <li>Provide your order number, a brief explanation, and clear photos or a short video showing the damage/defect.</li>
            <li>Once verified, we will arrange for a replacement of the damaged item to be handcrafted and shipped to you at no additional cost.</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-2">
            3. Refunds
          </h2>
          <p>
            If a replacement is not possible due to material availability, a refund or store credit will be processed. Approved refunds are credited back to the original payment method within 5-7 business days.
          </p>
        </div>
      </article>
    </main>
  );
}
