import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandaloneSizeGuide } from "@/components/SizeGuide";
import { t } from "@/lib/i18n";
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
  if (slug === "size-guide") return { title: t("zh", "sizeGuide") };
  if (slug === "shipping-returns") return { title: t("zh", "shippingReturns") };
  return {};
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const lang = "zh" as const;

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
  const shop = await getShop();
  const threshold = formatMoney(shop.settings.freeShippingThreshold, "TWD", lang);
  const flat = formatMoney(shop.settings.flatShipping, "TWD", lang);
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
