import Link from "next/link";

export default function BrandStory() {
  return (
    <section className="story section">
      <div className="story-art" aria-hidden="true">
        <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="st-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F0DFC6" />
              <stop offset="1" stopColor="#D9B88D" />
            </linearGradient>
            <linearGradient id="st-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4B7392" />
              <stop offset="1" stopColor="#1B365D" />
            </linearGradient>
            <clipPath id="st-arch">
              <path d="M 60 500 L 60 220 Q 60 70 200 70 Q 340 70 340 220 L 340 500 Z" />
            </clipPath>
          </defs>
          <rect width="400" height="500" fill="url(#st-bg)" />
          <g clipPath="url(#st-arch)">
            <rect x="60" y="60" width="280" height="440" fill="#F7EAD3" />
            <circle cx="200" cy="260" r="64" fill="#C5A059" />
            <rect x="60" y="280" width="280" height="220" fill="url(#st-sea)" />
            {[300, 322, 346, 372, 400].map((y, i) => (
              <path key={y} d={`M 60 ${y} q 35 -9 70 0 t 70 0 t 70 0 t 70 0`} fill="none" stroke="#FAF8F5" strokeOpacity={0.5 - i * 0.07} strokeWidth="1.6" />
            ))}
            <rect x="140" y="282" width="120" height="3" fill="#E8CE97" opacity="0.8" />
            <rect x="160" y="296" width="80" height="3" fill="#E8CE97" opacity="0.6" />
          </g>
        </svg>
      </div>
      <div className="story-copy">
        <p className="eyebrow">Our story</p>
        <h2 className="serif">
          Made for the hour
          <br />
          the light turns gold.
        </h2>
        <p>
          SOLISIA BAY began with a simple idea: the best holidays are made of quiet things. A linen shirt that has softened
          with every wash. A swimsuit that fits so well you forget it. The long, unhurried walk back from the water.
        </p>
        <p>
          We design for two, resort wear for her and Miami-inspired resort wear for him, in a palette of sand, sea and sun.
          Every piece is cut to move easily from the shoreline to the table, with details you notice only when you look
          twice.
        </p>
        <ul className="story-points">
          <li>
            <strong>Mix &amp; match</strong>
            <span>Bikinis sold as separates, sized independently.</span>
          </li>
          <li>
            <strong>Cut for the body</strong>
            <span>Detailed size guides in cm and inches.</span>
          </li>
          <li>
            <strong>Worldwide</strong>
            <span>Free shipping on orders over $120 USD.</span>
          </li>
        </ul>
        <Link href="/collection/all" className="btn btn-outline">
          Explore the collection
        </Link>
      </div>
    </section>
  );
}
