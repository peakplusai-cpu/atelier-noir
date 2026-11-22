import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandaloneSizeGuide } from "@/components/SizeGuide";
import { convertAmount, getRates } from "@/lib/fx";
import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";
import { formatMoney } from "@/lib/money";
import { returnsCopy, shippingCopy } from "@/lib/policies";
import { getShop } from "@/lib/shop";

type Props = { params: Promise<{ slug: string }> };

const SLUGS = ["shipping-returns", "size-guide"];

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const market = await getMarket();
  if (slug === "size-guide") return { title: t(market.lang, "sizeGuide") };
  if (slug === "shipping-returns") return { title: t(market.lang, "shippingReturns") };
  return {};
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const market = await getMarket();
  const lang = market.lang;

  if (slug === "size-guide") {
    return (
      <section className="page narrow">
        <header className="collection-head">
          <p className="eyebrow">{t(lang, "help")}</p>
          <h1 className="serif">{t(lang, "sizeGuide")}</h1>
          <p className="lede">{t(lang, "sizeGuideLede")}</p>
        </header>
        <StandaloneSizeGuide />
      </section>
    );
  }

  if (slug !== "shipping-returns") notFound();
  const [rates, shop] = await Promise.all([getRates(), getShop()]);
  const threshold = formatMoney(convertAmount(shop.settings.freeShippingThreshold, market.currency, rates), market.currency, lang);
  const flat = formatMoney(convertAmount(shop.settings.flatShipping, market.currency, rates), market.currency, lang);
  const sections = [
    { heading: t(lang, "shipping"), body: shippingCopy(lang, threshold, flat) },
    { heading: t(lang, "returns"), body: returnsCopy(lang) },
  ];
  return (
    <section className="page narrow">
      <header className="collection-head">
        <p className="eyebrow">{t(lang, "help")}</p>
        <h1 className="serif">{t(lang, "shippingReturns")}</h1>
      </header>
      <div className="prose">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="serif">{section.heading}</h2>
            {section.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
