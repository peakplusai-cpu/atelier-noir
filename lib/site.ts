export const SITE_URL = "https://bryancar.com";
export const SITE_URL_ALIAS = "https://atelier-noir-dun.vercel.app";
export const SITE_NAME = "Bryan's Garage";
export const SITE_NAME_ZH = "布萊恩車庫";
export const SITE_DESCRIPTION = "台中進口車買賣、預約鑑賞 LINE";
export const SITE_STREET = "大慶街一段 208 號";
export const SITE_LOCALITY = "台中市南區";
export const SITE_REGION = "台中市";
export const SITE_COUNTRY = "TW";
export const SITE_LAT = 24.11667;
export const SITE_LNG = 120.655845;

export const jsonLdAutoDealer = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: SITE_NAME,
  alternateName: SITE_NAME_ZH,
  url: SITE_URL,
  sameAs: [SITE_URL_ALIAS],
  image: `${SITE_URL}/og.jpg`,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_STREET,
    addressLocality: SITE_LOCALITY,
    addressRegion: SITE_REGION,
    addressCountry: SITE_COUNTRY,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE_LAT,
    longitude: SITE_LNG,
  },
  areaServed: {
    "@type": "City",
    name: "Taichung",
  },
} as const;
