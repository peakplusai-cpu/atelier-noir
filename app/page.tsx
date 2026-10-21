import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { YSlash } from "@/components/YSlash";
import { formatPrice, padIndex, statusLabel } from "@/lib/format";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const published = store.cars.filter((car) => car.published);
  const featured = published.find((car) => car.featured) ?? published[0];
  const staff = [...store.staff].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <Header />
      {featured ? (
        <section className="hero">
          <div className="hero-media">
            <img src={featured.photos[0]?.url} alt={`${featured.make} ${featured.model}`} />
          </div>
          <div className="hero-shade" />
          <YSlash />
          <div className="hero-copy reveal">
            <p className="engraved hero-kicker">01 / Collection</p>
            <h1>{featured.make}</h1>
            <h2>{featured.model}</h2>
            <hr className="hairline" />
            <p className="hero-meta">
              <span>{featured.year}</span>
              <span>{featured.color}</span>
              <span>{featured.mileage.toLocaleString("zh-TW")} km</span>
              <span>{formatPrice(featured.price)}</span>
            </p>
          </div>
        </section>
      ) : null}

      <section className="section" id="collection">
        <div className="section-head">
          <div>
            <p className="engraved">Inventory</p>
            <h2>本期珍藏</h2>
          </div>
          <p className="engraved">{padIndex(published.length)} 輛上架</p>
        </div>
        <ol className="catalog">
          {published.map((car, i) => (
            <li key={car.id}>
              <Link href={`/cars/${car.slug}`}>
                <span className="idx">{padIndex(i + 1)}</span>
                <span className="make">{car.make}</span>
                <span className="model">
                  {car.year} {car.model}
                </span>
                <span className="price">{formatPrice(car.price)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {published.map((car, i) => (
        <article key={car.id} className={`chapter${i % 2 === 1 ? " reverse" : ""}`}>
          <div className="chapter-media">
            <img src={car.photos[0]?.url} alt={`${car.make} ${car.model}`} />
          </div>
          <div className="chapter-copy">
            <p className="engraved">
              <span className={`status-dot ${car.status}`} />
              {statusLabel(car.status)} · {padIndex(i + 1)}
            </p>
            <h3>{car.make}</h3>
            <p className="model-line">
              {car.year} {car.model}
            </p>
            <div className="pinstripe" />
            <dl className="spec-row">
              <div>
                <dt>外色</dt>
                <dd>{car.color}</dd>
              </div>
              <div>
                <dt>內裝</dt>
                <dd>{car.interior}</dd>
              </div>
              <div>
                <dt>動力</dt>
                <dd>
                  {car.engine} · {car.horsepower} hp
                </dd>
              </div>
              <div>
                <dt>標價</dt>
                <dd>{formatPrice(car.price)}</dd>
              </div>
            </dl>
            <Link className="link-line" href={`/cars/${car.slug}`}>
              完整詳細
            </Link>
          </div>
        </article>
      ))}

      <Footer staff={staff} />
    </>
  );
}
