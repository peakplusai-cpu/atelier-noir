import { formatPrice, hasDiscountPrice } from "@/lib/format";
import type { Car } from "@/lib/types";

export function PriceTag({
  car,
  className,
}: {
  car: Pick<Car, "price" | "originalPrice">;
  className?: string;
}) {
  if (hasDiscountPrice(car)) {
    return (
      <span className={["price-tag", className].filter(Boolean).join(" ")}>
        <s className="price-was">{formatPrice(car.originalPrice!)}</s>
        <span className="price-now">{formatPrice(car.price)}</span>
      </span>
    );
  }
  return (
    <span className={["price-tag", className].filter(Boolean).join(" ")}>
      <span className="price-now">{formatPrice(car.price)}</span>
    </span>
  );
}
