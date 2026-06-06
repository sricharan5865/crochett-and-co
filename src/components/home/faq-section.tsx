import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do I place an order?",
    a: "You can browse our collection and add items to your cart, or simply click 'Order on WhatsApp' on any product to instantly connect with us. We also accept custom orders through our Custom Order form.",
  },
  {
    q: "How long does delivery take?",
    a: "Ready-made products are delivered within 3-5 business days. Custom orders take 7-14 business days depending on complexity. We'll keep you updated on your order status via WhatsApp.",
  },
  {
    q: "Can I customize my order?",
    a: "Absolutely! Customization is what we do best. You can choose colors, flower types, quantities, and even add personalized notes. Use our Custom Order page or Build Your Bouquet feature to get started.",
  },
  {
    q: "What is your return policy?",
    a: "Since each product is handmade specifically for you, we don't accept returns on undamaged items. However, if your order arrives damaged, we'll happily replace it or offer a full refund.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major payment methods including UPI, debit/credit cards, net banking, and popular wallets. We also offer Cash on Delivery (COD) for select pin codes.",
  },
  {
    q: "How should I care for my crochet flowers?",
    a: "Keep them away from direct sunlight to prevent color fading. Dust gently with a soft brush. Avoid water and moisture. Your crochet flowers are designed to last a lifetime with basic care!",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-muted-foreground">
          Got questions? We&apos;ve got answers.
        </p>
      </div>

      <Accordion className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-card rounded-xl border border-border/50 px-6 shadow-sm"
          >
            <AccordionTrigger className="text-left font-medium text-foreground hover:text-rose-pink py-5">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
