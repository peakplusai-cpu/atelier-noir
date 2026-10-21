"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HeroReel } from "@/components/HeroReel";
import { Marquee } from "@/components/Marquee";
import {
  brandOptions,
  filterCars,
  PRICE_RANGES,
  type DoorFilter,
} from "@/lib/catalog";
import { formatPrice, padIndex, statusLabel } from "@/lib/format";
import type { Car } from "@/lib/types";

export function HomeFinder({ cars }: { cars: Car[] }) {
  const [brand, setBrand] = useState("");
  const [doors, setDoors] = useState<DoorFilter>(0);
  const [price, setPrice] = useState<(typeof PRICE_RANGES)[number]["id"]>("any");
  const brands = useMemo(() => brandOptions(cars), [cars]);
  const matches = useMemo(() => filterCars(cars, brand, doors, price), [cars, brand, doors, price]);

  return (
    <>
      <section className="finder">
        <HeroReel />
        <div className="hero-shade" />
        <div className="hud">
          <i />
          <div className="hud-note">
                24.116670° N<br />
                120.655845° E
          </div>
        </div>
        <div className="finder-panel">
          <p className="hero-tag">
            <span className="blip" />
            台中 · 先選條件
          </p>
          <h1 className="finder-title">指定品牌</h1>

          <fieldset className="finder-block">
            <legend className="vh">指定品牌</legend>
            <div className="finder-brands">
              <button type="button" data-on={brand === ""} onClick={() => setBrand("")}>
                全部
              </button>
              {brands.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-on={brand === item.id}
                  onClick={() => setBrand(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="finder-block">
            <legend>車門</legend>
            <div className="finder-doors">
              <button type="button" data-on={doors === 2} onClick={() => setDoors(2)}>
                <b>02</b>
                <span>雙門</span>
              </button>
              <button type="button" data-on={doors === 4} onClick={() => setDoors(4)}>
                <b>04</b>
                <span>四門</span>
              </button>
              <button type="button" data-on={doors === 0} onClick={() => setDoors(0)}>
                <b>ALL</b>
                <span>不限</span>
              </button>
            </div>
          </fieldset>

          <fieldset className="finder-block">
            <legend>價格區間</legend>
            <div className="finder-prices">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  data-on={price === range.id}
                  onClick={() => setPrice(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </fieldset>

          <a className="btn finder-go" href="#collection">
            查看庫存 {padIndex(matches.length)}
          </a>
        </div>
      </section>

      <Marquee />

      <section className="section" id="collection">
        <div className="section-head">
          <div>
            <p className="engraved">Inventory · 本期庫存</p>
            <h2>Stock</h2>
          </div>
          <span className="section-count">{padIndex(matches.length)}</span>
        </div>
        {matches.length ? (
          <ol className="catalog">
            {matches.map((car, i) => (
              <li key={car.id}>
                <Link href={`/cars/${car.slug}`}>
                  <span className="idx">{padIndex(i + 1)}</span>
                  <span className="make">{car.make}</span>
                  <span className="model">
                    {car.year} / {car.doors === 2 ? "雙門" : "四門"} / {car.model}
                  </span>
                  <span className="price">{formatPrice(car.price)}</span>
                  <span className="arrow">↗</span>
                  {car.photos[0] ? <img className="row-thumb" src={car.photos[0].url} alt="" /> : null}
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-line">
            {cars.length
              ? "此條件目前沒有車輛。可改選品牌、車門或價格區間。"
              : "尚無上架車輛。由員工後台新增並公開後，才會出現於此。"}
          </p>
        )}
      </section>

      {matches.map((car, i) => (
        <article key={car.id} className="poster">
          <div className="poster-media">
            <img src={car.photos[0]?.url} alt={`${car.make} ${car.model}`} />
            <span className="poster-ghost">{padIndex(i + 1)}</span>
          </div>
          <div className="poster-bar">
            <div>
              <p className="engraved">
                <span className={`status-dot ${car.status}`} />
                {statusLabel(car.status)} · {car.doors === 2 ? "雙門" : "四門"}
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
    </>
  );
}
