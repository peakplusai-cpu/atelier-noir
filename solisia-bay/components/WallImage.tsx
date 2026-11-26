"use client";

import { useState } from "react";

/** Portrait photos fill the square. A wide logo stays whole instead of being cropped. */
export function WallImage({ src, alt }: { src: string; alt: string }) {
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ objectFit: fit }}
      loading="lazy"
      decoding="async"
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.naturalWidth > image.naturalHeight * 1.2) setFit("contain");
      }}
    />
  );
}
