"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Option = { value: string; label: string };

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function FilterBar({
  sizes,
  styles,
  brands = [],
  tags = [],
  total,
  shown,
}: {
  sizes: string[];
  styles: Option[];
  brands?: string[];
  tags?: string[];
  total: number;
  shown: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const selectedSizes = (params.get("size") ?? "").split(",").filter(Boolean);
  const selectedStyles = (params.get("style") ?? "").split(",").filter(Boolean);
  const selectedBrands = (params.get("brand") ?? "").split(",").filter(Boolean);
  const selectedTags = (params.get("tag") ?? "").split(",").filter(Boolean);
  const sort = params.get("sort") ?? "featured";
  const active = selectedSizes.length + selectedStyles.length + selectedBrands.length + selectedTags.length;

  const push = (next: { size?: string[]; style?: string[]; brand?: string[]; tag?: string[]; sort?: string }) => {
    const q = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined) => (v ? q.set(k, v) : q.delete(k));
    if (next.size) set("size", next.size.join(","));
    if (next.style) set("style", next.style.join(","));
    if (next.brand) set("brand", next.brand.join(","));
    if (next.tag) set("tag", next.tag.join(","));
    if (next.sort !== undefined) set("sort", next.sort === "featured" ? "" : next.sort);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="filters">
      <div className="filters-bar">
        <button type="button" className="filter-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          篩選 Filter{active > 0 && <span className="filter-count">{active}</span>}
          <span aria-hidden>{open ? "\u2212" : "+"}</span>
        </button>
        <p className="filters-result">
          {shown === total ? `${total} pieces` : `${shown} of ${total} pieces`}
        </p>
        <label className="sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => push({ sort: e.target.value })}>
            <option value="featured">Featured</option>
            <option value="newest">New arrivals</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="filters-panel" data-open={open}>
        <div className="filter-group">
          <h3>款式 Style</h3>
          <div className="chips">
            {styles.map((s) => (
              <button
                key={s.value}
                type="button"
                className="chip"
                data-active={selectedStyles.includes(s.value)}
                aria-pressed={selectedStyles.includes(s.value)}
                onClick={() => push({ style: toggle(selectedStyles, s.value) })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <h3>尺寸 Size</h3>
          <div className="chips">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                className="chip chip-size"
                data-active={selectedSizes.includes(s)}
                aria-pressed={selectedSizes.includes(s)}
                onClick={() => push({ size: toggle(selectedSizes, s) })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {brands.length > 0 && (
          <div className="filter-group">
            <h3>品牌 Brand</h3>
            <div className="chips">
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className="chip"
                  data-active={selectedBrands.includes(brand)}
                  aria-pressed={selectedBrands.includes(brand)}
                  onClick={() => push({ brand: toggle(selectedBrands, brand) })}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div className="filter-group">
            <h3>場景 Tag</h3>
            <div className="chips">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="chip"
                  data-active={selectedTags.includes(tag)}
                  aria-pressed={selectedTags.includes(tag)}
                  onClick={() => push({ tag: toggle(selectedTags, tag) })}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        {active > 0 && (
          <button type="button" className="link-btn" onClick={() => push({ size: [], style: [], brand: [], tag: [] })}>
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
