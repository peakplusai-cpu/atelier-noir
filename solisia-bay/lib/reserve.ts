import { variantKey } from "./catalog";
import { priceCart, PricingError, type PricedCart } from "./pricing";
import { mutateShop, publishedProducts } from "./shop";

/** Prices from the live catalog, then holds stock and a coupon redemption. */
export async function reserveCheckout(rawItems: unknown, coupon = ""): Promise<PricedCart> {
  return mutateShop(async (shop) => {
    const quote = priceCart(rawItems, publishedProducts(shop), {
      coupon,
      promotions: shop.promotions,
      threshold: shop.settings.freeShippingThreshold,
      flat: shop.settings.flatShipping,
    });
    for (const item of quote.items) {
      const product = shop.products.find((entry) => entry.slug === item.slug);
      if (!product?.inventory) continue;
      const key = variantKey(item.color, item.size);
      const left = product.inventory[key] ?? 0;
      if (left < item.qty) throw new PricingError("Some pieces don't have enough stock. Please review your bag.", 409);
      product.inventory[key] = left - item.qty;
    }
    if (quote.promoId) {
      const promo = shop.promotions.find((entry) => entry.id === quote.promoId);
      if (!promo || (promo.usageLimit > 0 && promo.used >= promo.usageLimit)) {
        throw new PricingError("That code has been fully used.");
      }
      promo.used += 1;
    }
    return quote;
  });
}
