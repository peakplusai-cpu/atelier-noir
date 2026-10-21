import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HomeFinder } from "@/components/HomeFinder";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const published = store.cars.filter((car) => car.published);
  const featured = published.find((car) => car.featured) ?? published[0];
  const staff = [...store.staff].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <Header />
      <HomeFinder cars={published} featured={featured} />
      <Footer staff={staff} />
    </>
  );
}
