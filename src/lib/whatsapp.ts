const WHATSAPP_NUMBER = "919701933144";

export function generateWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function generateProductInquiry(product: {
  name: string;
  price: number;
  slug: string;
}): string {
  const message = `Hello Crochett & Co! 🌸

I'm interested in: *${product.name}*
Price: ₹${product.price.toLocaleString("en-IN")}
Link: https://crochettandco.com/shop/${product.slug}

Could you please share more details about availability and delivery?

Thank you! 💐`;
  return generateWhatsAppLink(message);
}

export function generateCustomOrderMessage(order: {
  name: string;
  phone: string;
  productType: string;
  colors: string;
  quantity: number;
  budget: string;
  deliveryDate: string;
  address: string;
  notes: string;
}): string {
  const message = `Hello Crochett & Co! 🌸

I would like to request a custom crochet order.

*Name:* ${order.name}
*Phone:* ${order.phone}
*Product Type:* ${order.productType}
*Colors:* ${order.colors}
*Quantity:* ${order.quantity}
*Budget:* ${order.budget}
*Delivery Date:* ${order.deliveryDate}
*Address:* ${order.address}
*Additional Notes:* ${order.notes}

Please provide pricing and availability.

Thank you! 💐`;
  return generateWhatsAppLink(message);
}

export function generateBouquetOrderMessage(bouquet: {
  flowers: { name: string; quantity: number; price: number }[];
  wrapping: string;
  totalPrice: number;
  note?: string;
}): string {
  const flowerList = bouquet.flowers
    .map((f) => `  • ${f.name} × ${f.quantity} — ₹${f.price * f.quantity}`)
    .join("\n");

  const message = `Hello Crochett & Co! 🌸

I'd like to order a custom bouquet:

*Flowers:*
${flowerList}

*Gift Wrapping:* ${bouquet.wrapping}
*Estimated Total:* ₹${bouquet.totalPrice.toLocaleString("en-IN")}
${bouquet.note ? `*Personal Note:* ${bouquet.note}` : ""}

Please confirm availability and delivery timeline.

Thank you! 💐`;
  return generateWhatsAppLink(message);
}

export function generateGiftHamperMessage(hamper: {
  items: { name: string; quantity: number }[];
  totalPrice: number;
  recipientName?: string;
  occasion?: string;
}): string {
  const itemList = hamper.items
    .map((i) => `  • ${i.name} × ${i.quantity}`)
    .join("\n");

  const message = `Hello Crochett & Co! 🌸

I'd like to create a gift hamper:

*Items:*
${itemList}

${hamper.recipientName ? `*For:* ${hamper.recipientName}` : ""}
${hamper.occasion ? `*Occasion:* ${hamper.occasion}` : ""}
*Estimated Total:* ₹${hamper.totalPrice.toLocaleString("en-IN")}

Please confirm pricing and delivery options.

Thank you! 💐`;
  return generateWhatsAppLink(message);
}

export function generateQuickChat(): string {
  return generateWhatsAppLink(
    "Hello Crochett & Co! 🌸 I'd like to know more about your handmade crochet products."
  );
}
