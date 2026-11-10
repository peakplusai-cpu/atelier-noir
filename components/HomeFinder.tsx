"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BuybackLauncher } from "@/components/BuybackLauncher";
import { HeroReel } from "@/components/HeroReel";
import { InstagramButton } from "@/components/InstagramButton";
import { Marquee } from "@/components/Marquee";
import { PriceTag } from "@/components/PriceTag";
import {
  brandOptions,
  DOOR_OPTIONS,
  doorLabel,
  filterCars,
  PRICE_RANGES,
  type DoorFilter,
} from "@/lib/catalog";
import { padIndex, statusLabel } from "@/lib/format";
import type { Car, Staff } from "@/lib/types";

export function HomeFinder({
  cars,
  staff,
  instagram,
}: {
  cars: Car[];
  staff: Staff[];
  instagram: string;
}) {
  const [brand, setBrand] = useState("");
  const [doors, setDoors] = useState<DoorFilter>(0);
  const [price, setPrice] = useState<(typeof PRICE_RANGES)[number]["id"]>("any");
  const [openId, setOpenId] = useState<string | null>(null);
  const brands = useMemo(() => brandOptions(cars), [cars]);
  const matches = useMemo(() => filterCars(cars, brand, doors, price), [cars, brand, doors, price]);

  useEffect(() => {
    setOpenId(null);
  }, [brand, doors, price]);

  function toggleRow(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

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
              {DOOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-on={doors === option.value}
                  onClick={() => setDoors(option.value)}
                >
                  <b>{option.code}</b>
                  <span>{option.label}</span>
                </button>
              ))}
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

          <div className="finder-actions">
            <a className="btn finder-go" href="#collection">
              查看庫存 {padIndex(matches.length)}
            </a>
            <BuybackLauncher staff={staff} />
            <InstagramButton username={instagram} />
          </div>
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
            {matches.map((car, i) => {
              const open = openId === car.id;
              return (
                <li key={car.id} data-open={open}>
                  <div
                    className="catalog-row"
                    data-open={open}
                    onClick={() => toggleRow(car.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleRow(car.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                  >
                    <span className="idx">{padIndex(i + 1)}</span>
                    <span className="catalog-copy">
                      <span className="make">{car.makeEn || car.make}</span>
                      <span className="model">
                        {car.year} / {doorLabel(car.doors)} / {car.model}
                      </span>
                      <PriceTag car={car} className="price" />
                    </span>
                    {car.photos[0] ? (
                      <img
                        className="row-thumb"
                        src={car.photos[0].url}
                        alt=""
                        data-open={open}
                      />
                    ) : (
                      <span className="row-thumb row-thumb-empty" data-open={open} aria-hidden />
                    )}
                    <Link
                      className="arrow"
                      href={`/cars/${car.slug}`}
                      aria-label={`${car.make} ${car.model} 詳情`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      ↗
                    </Link>
                  </div>
                </li>
              );
            })}
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
                {statusLabel(car.status)} · {doorLabel(car.doors)}
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
                <dt>售價 Price</dt>
                <dd>
                  <PriceTag car={car} />
                </dd>
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
