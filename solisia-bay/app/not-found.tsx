import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page narrow center">
      <p className="eyebrow">404</p>
      <h1 className="serif">Lost at sea</h1>
      <p>We couldn&rsquo;t find the page you were looking for.</p>
      <Link href="/collection/all" className="btn btn-solid">
        Back to the collection
      </Link>
    </section>
  );
}
