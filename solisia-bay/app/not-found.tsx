import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page narrow center">
      <h1 className="serif">找不到這個頁面</h1>
      <Link href="/collection/all" className="btn btn-solid">
        回選品 Back to the shop
      </Link>
    </section>
  );
}
