import Link from "next/link";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Marquee } from "@/components/Marquee";
import { formatMileage, formatPrice, padIndex, statusLabel, titleUnits } from "@/lib/format";
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
          <div className="hero-stage">
            <div className="hero-media">
              <img src={featured.photos[0]?.url} alt={`${featured.make} ${featured.model}`} />
            </div>
            <div className="hero-shade" />
            <div className="hud">
              <i />
              <div className="hud-note">
                24.1477° N<br />
                120.6736° E
              </div>
            </div>
            <div className="hero-body">
              <p className="hero-tag">
                <span className="blip" />
                本期主打 · {statusLabel(featured.status)}
              </p>
              <h1 className="hero-title" style={{ "--units": titleUnits(featured.make) } as CSSProperties}>
                <span>{featured.make}</span>
              </h1>
              <p className="hero-model">
                {featured.year} / {featured.model}
              </p>
            </div>
          </div>
          <dl className="telemetry">
            <div>
              <dt>Year · 年份</dt>
              <dd>{featured.year}</dd>
            </div>
            <div>
              <dt>Odo · 里程</dt>
              <dd>{formatMileage(featured.mileage)}</dd>
            </div>
            <div>
              <dt>Color · 外色</dt>
              <dd>{featured.color}</dd>
            </div>
            <div>
              <dt>Price · 標價</dt>
              <dd>{formatPrice(featured.price)}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="hero hero-void">
          <div className="hero-stage">
            <div className="hud">
              <i />
            </div>
            <div className="hero-body">
              <p className="hero-tag">
                <span className="blip" />
                尚無上架車輛
              </p>
              <h1 className="hero-title" style={{ "--units": 8 } as CSSProperties}>
                <span>Car House</span>
              </h1>
              <p className="hero-model">台中 / 預約制 / 僅員工上架之車輛公開</p>
            </div>
          </div>
          <dl className="telemetry">
            <div>
              <dt>Base · 據點</dt>
              <dd>台中</dd>
            </div>
            <div>
              <dt>Access · 方式</dt>
              <dd>預約制</dd>
            </div>
            <div>
              <dt>Stock · 庫存</dt>
              <dd>00</dd>
            </div>
            <div>
              <dt>Status · 狀態</dt>
              <dd>籌備中</dd>
            </div>
          </dl>
        </section>
      )}

      <Marquee />

      <section className="section" id="collection">
        <div className="section-head">
          <div>
            <p className="engraved">Inventory · 本期庫存</p>
            <h2>Stock</h2>
          </div>
          <span className="section-count">{padIndex(published.length)}</span>
        </div>
        {published.length ? (
          <ol className="catalog">
            {published.map((car, i) => (
              <li key={car.id}>
                <Link href={`/cars/${car.slug}`}>
                  <span className="idx">{padIndex(i + 1)}</span>
                  <span className="make">{car.make}</span>
                  <span className="model">
                    {car.year} / {car.model}
                  </span>
                  <span className="price">{formatPrice(car.price)}</span>
                  <span className="arrow">↗</span>
                  {car.photos[0] ? <img className="row-thumb" src={car.photos[0].url} alt="" /> : null}
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-line">尚無上架車輛。由員工後台新增並公開後，才會出現於此。</p>
        )}
      </section>

      {published.map((car, i) => (
        <article key={car.id} className="poster">
          <div className="poster-media">
            <img src={car.photos[0]?.url} alt={`${car.make} ${car.model}`} />
            <span className="poster-ghost">{padIndex(i + 1)}</span>
          </div>
          <div className="poster-bar">
            <div>
              <p className="engraved">
                <span className={`status-dot ${car.status}`} />
                {statusLabel(car.status)}
              </p>
              <h3>{car.make}</h3>
              <p className="poster-model">
                {car.year} / {car.model}
              </p>
            </div>
            <dl className="spec-row">
              <div>
                <dt>外色 Color</dt>
                <dd>{car.color}</dd>
              </div>
              <div>
                <dt>內裝 Interior</dt>
                <dd>{car.interior}</dd>
              </div>
              <div>
                <dt>動力 Power</dt>
                <dd>
                  {car.engine} · {car.horsepower} hp
                </dd>
              </div>
              <div>
                <dt>標價 Price</dt>
                <dd>{formatPrice(car.price)}</dd>
              </div>
            </dl>
            <Link className="btn" href={`/cars/${car.slug}`}>
              完整規格 →
            </Link>
          </div>
        </article>
      ))}

      <Footer staff={staff} />
    </>
  );
}
