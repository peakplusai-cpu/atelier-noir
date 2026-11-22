import Link from "next/link";
import { t } from "@/lib/i18n";
import { getMarket } from "@/lib/market-server";

export default async function NotFound() {
  const { lang } = await getMarket();
  return (
    <section className="page narrow center">
      <h1 className="serif">{t(lang, "notFound")}</h1>
      <Link href="/collection/all" className="btn btn-solid">
        {t(lang, "backShop")}
      </Link>
    </section>
  );
}
