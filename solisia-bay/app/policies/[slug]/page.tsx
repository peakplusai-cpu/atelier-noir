import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandaloneSizeGuide } from "@/components/SizeGuide";
import { POLICY_PAGES } from "@/lib/policies";

type Props = { params: Promise<{ slug: string }> };

const SLUGS = [...Object.keys(POLICY_PAGES), "size-guide"];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "size-guide") return { title: "Size Guide" };
  const page = POLICY_PAGES[slug];
  return page ? { title: page.title } : {};
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "size-guide") {
    return (
      <section className="page narrow">
        <header className="collection-head">
          <p className="eyebrow">Help</p>
          <h1 className="serif">Size Guide</h1>
          <p className="lede">Body measurements in centimetres or inches. Switch units any time.</p>
        </header>
        <StandaloneSizeGuide />
      </section>
    );
  }

  const page = POLICY_PAGES[slug];
  if (!page) notFound();
  return (
    <section className="page narrow">
      <header className="collection-head">
        <p className="eyebrow">Help</p>
        <h1 className="serif">{page.title}</h1>
      </header>
      <div className="prose">
        {page.sections.map((s) => (
          <div key={s.heading}>
            <h2 className="serif">{s.heading}</h2>
            {s.body.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
