import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { doorLabel } from "@/lib/catalog";
import { formatMileage, formatPrice, statusLabel, titleUnits } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore();
  const car = store.cars.find((item) => item.slug === slug && item.published);
  if (!car) notFound();
  const staff = [...store.staff].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = car.photos[0];
  const rest = car.photos.slice(1);

  return (
    <>
      <Header />
      <section className="detail-hero">
        {cover ? <img src={cover.url} alt={cover.alt || `${car.make} ${car.model}`} /> : null}
        <div className="detail-shade" />
        <div className="detail-title">
          <p className="engraved">
            <span className={`status-dot ${car.status}`} />
            {statusLabel(car.status)}
            {car.makeEn ? ` · ${car.makeEn}` : ""}
          </p>
          <h1 style={{ "--units": titleUnits(car.make) } as CSSProperties}>
            <span>{car.make}</span>
          </h1>
          <p className="detail-model">
            {car.year} / {car.model}
          </p>
        </div>
      </section>

      <div className="price-band">
        <div>
          <p className="engraved">Price · 標價</p>
          <strong>{formatPrice(car.price)}</strong>
        </div>
        <Link className="btn" href={`/inquiry?car=${car.slug}`}>
          預約鑑賞 →
        </Link>
      </div>

      <section className="sheet">
        <p className="story">{car.story}</p>
        <dl className="facts">
          <div>
            <dt>廠牌</dt>
            <dd>
              {car.make} / {car.makeEn}
            </dd>
          </div>
          <div>
            <dt>車型</dt>
            <dd>{car.model}</dd>
          </div>
          <div>
            <dt>車門</dt>
            <dd>{doorLabel(car.doors)}</dd>
          </div>
          <div>
            <dt>年份</dt>
            <dd>{car.year}</dd>
          </div>
          <div>
            <dt>標價</dt>
            <dd>{formatPrice(car.price)}</dd>
          </div>
          <div>
            <dt>里程</dt>
            <dd>{formatMileage(car.mileage)}</dd>
          </div>
          <div>
            <dt>外色</dt>
            <dd>{car.color}</dd>
          </div>
          <div>
            <dt>內裝</dt>
            <dd>{car.interior}</dd>
          </div>
          <div>
            <dt>引擎</dt>
            <dd>{car.engine}</dd>
          </div>
          <div>
            <dt>馬力</dt>
            <dd>{car.horsepower} hp</dd>
          </div>
          <div>
            <dt>變速</dt>
            <dd>{car.transmission}</dd>
          </div>
          <div>
            <dt>驅動</dt>
            <dd>{car.drivetrain}</dd>
          </div>
          <div>
            <dt>狀態</dt>
            <dd>{statusLabel(car.status)}</dd>
          </div>
        </dl>
      </section>

      {car.options.length ? (
        <section className="options">
          <p className="engraved">選配</p>
          <ul>
            {car.options.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {car.photos.length > 1 ? (
        <section className="gallery">
          <img className="gallery-main" src={(rest[0] ?? cover)?.url} alt={(rest[0] ?? cover)?.alt} />
          <div className="gallery-stack">
            {(rest[1] ? [rest[1], cover] : car.photos.slice(0, 2)).map((photo) =>
              photo ? <img key={photo.id} src={photo.url} alt={photo.alt} /> : null
            )}
          </div>
        </section>
      ) : null}

      <Link className="cta-block" href={`/inquiry?car=${car.slug}`}>
        <p className="engraved">Inquiry · 選擇顧問，前往 LINE</p>
        <span className="cta-big">預約鑑賞</span>
        <span className="cta-arrow">→</span>
      </Link>
      <Footer staff={staff} />
    </>
  );
}
