import Link from "next/link";
import { SITE } from "@/lib/site";

export default function BrandStory() {
  return (
    <section className="story section">
      <div className="story-art story-poster" aria-hidden="true">
        <p>CLACK</p>
        <span>EST. SESSION</span>
      </div>
      <div className="story-copy">
        <p className="eyebrow">選品店 Select shop</p>
        <h2 className="serif">
          不是櫥窗。
          <br />
          是會上場的衣服。
        </h2>
        <p>
          {SITE.name} 是給街舞和滑板的選品店。我們挑的是圈內真的會穿去練、去滑、去拍照的單品，不是度假目錄裡的安靜亞麻。
        </p>
        <p>{SITE.tagline} {SITE.taglineZh}</p>
        <ul className="story-points">
          <li>
            <strong>Select</strong>
            <span>每一件都標得出品牌。Brand sits on the card.</span>
          </li>
          <li>
            <strong>Session</strong>
            <span>尺寸表還在，公分和英吋都能看。</span>
          </li>
          <li>
            <strong>Worldwide</strong>
            <span>滿 ${SITE.freeShippingThreshold} USD 全球免運。</span>
          </li>
        </ul>
        <Link href="/collection/all" className="btn btn-outline">
          看全部選品
        </Link>
      </div>
    </section>
  );
}
