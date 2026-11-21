import { SITE } from "./site";

export const SHIPPING_COPY = [
  `滿 $${SITE.freeShippingThreshold} USD 全球免運。未滿額運費 $${SITE.flatShipping} USD。Free worldwide shipping over the threshold; a flat rate below it.`,
  "Orders are prepared within 1\u20133 business days. Typical delivery is 3\u20137 business days to the United States, 5\u201310 to Europe and 7\u201314 to the rest of the world. You will receive tracking by email once your order ships.",
  "Import duties and local taxes, where they apply, depend on your country and are shown or collected at checkout by our payment partner.",
];

export const RETURNS_COPY = [
  `Not quite right? Return unworn, unwashed items with original tags within ${SITE.returnDays} days of delivery for a refund to your original payment method, or exchange for another size or colour while stock lasts.`,
  `Start a return by emailing ${SITE.email} with your order number. We will reply with return instructions. Return shipping is at the customer's expense unless your item arrived damaged or incorrect.`,
];

export const POLICY_PAGES: Record<string, { title: string; sections: { heading: string; body: string[] }[] }> = {
  "shipping-returns": {
    title: "運送與退貨 Shipping & Returns",
    sections: [
      { heading: "Shipping", body: SHIPPING_COPY },
      { heading: "Returns & exchanges", body: RETURNS_COPY },
    ],
  },
};
