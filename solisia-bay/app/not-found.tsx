import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page narrow center">
      <p className="eyebrow">404</p>
      <h1 className="serif">這頁不在場上</h1>
      <p>找不到這個頁面。Lost the spot.</p>
      <Link href="/collection/all" className="btn btn-solid">
        回選品 Back to the shop
      </Link>
    </section>
  );
}
