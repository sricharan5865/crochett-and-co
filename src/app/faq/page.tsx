import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Frequently Asked Questions — Crochett & Co",
  description: "Find answers to all your questions about ordering, custom bouquets, shipping, delivery, payments, and product care at Crochett & Co.",
};

const faqCategories = [
  {
    category: "Ordering & Customization 🛍️",
    items: [
      {
        q: "How do I place an order?",
        a: "You can browse our collections and add items to your cart, or click 'Order on WhatsApp' to purchase directly through chat. For custom orders, use our Custom Order Wizard or Bouquet Builder to design your gift, and then send it to us via WhatsApp to complete the order.",
      },
      {
        q: "Can I customize the colors of a bouquet?",
        a: "Yes! All of our products are handmade, meaning we can customize them in almost any color you wish. You can specify color changes when configuring your custom designs or when speaking with us on WhatsApp.",
      },
      {
        q: "Do you accept bulk orders for corporate events or weddings?",
        a: "Absolutely! We create custom hampers, table centerpieces, and guest gifts for weddings, corporate events, baby showers, and more. Please contact us via email or WhatsApp at least 3-4 weeks in advance for bulk orders.",
      },
    ],
  },
  {
    category: "Delivery & Shipping 🚚",
    items: [
      {
        q: "What are the shipping charges?",
        a: "We offer Free Shipping on all orders above ₹999 across India. For orders below ₹999, a flat shipping fee of ₹49 is charged.",
      },
      {
        q: "How long will it take to receive my order?",
        a: "Since every item is made by hand, standard items are ready to ship in 3-5 business days. Custom designs and large bouquets take 7-14 business days to craft. Shipping transit time is usually 2-5 business days depending on your location.",
      },
      {
        q: "Do you offer international shipping?",
        a: "Currently, we only ship within India. We hope to open international shipping in the future!",
      },
    ],
  },
  {
    category: "Product Care & Quality 🧶",
    items: [
      {
        q: "How do I clean my crochet flowers?",
        a: "To clean your crochet flowers, simply dust them gently with a soft brush or use a hairdryer on the cool, low setting. For spots, spot clean with a damp cloth and mild soap. Do not wash in the washing machine or submerge in water.",
      },
      {
        q: "What materials do you use?",
        a: "We use premium, ultra-soft acrylic and cotton-blend yarns. These yarns are selected for their vibrant colors, durability, and texture, ensuring your flowers stay beautiful forever without losing shape.",
      },
      {
        q: "Are the flowers scented?",
        a: "Our standard flowers are unscented. However, you can spray them with a light mist of your favorite perfume or essential oil spray from a distance to give them a lovely fragrance!",
      },
    ],
  },
  {
    category: "Payments & Returns 💳",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Through our WhatsApp and checkout systems, we accept Google Pay, PhonePe, Paytm, UPI, all major Credit/Debit Cards, and Net Banking.",
      },
      {
        q: "What is your return policy?",
        a: "Because all our crochet items are custom made and handcrafted to order, they are non-returnable. However, if your item arrives damaged or there is a mistake in your order, please contact us within 48 hours of delivery with pictures, and we will happily make it right by sending a replacement.",
      },
      {
        q: "Can I cancel my order?",
        a: "You can cancel your order within 24 hours of placing it. Once crafting or material preparation has started after 24 hours, we cannot accept cancellations.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background py-16 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-5xl block mb-4">🙋‍♀️</span>
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Everything you need to know about our handmade products, shipping, payment, and custom options.
        </p>
      </div>

      <div className="space-y-12">
        {faqCategories.map((cat, idx) => (
          <div key={idx} className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6 border-b border-border/50 pb-3">
              {cat.category}
            </h2>
            <Accordion className="space-y-3">
              {cat.items.map((item, itemIdx) => (
                <AccordionItem
                  key={itemIdx}
                  value={`item-${idx}-${itemIdx}`}
                  className="border border-border/50 rounded-xl overflow-hidden px-4 hover:border-rose-pink/20 transition-colors"
                >
                  <AccordionTrigger className="font-heading font-medium text-foreground py-4 text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 pt-1">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </main>
  );
}
