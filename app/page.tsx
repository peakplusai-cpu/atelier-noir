import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Intro } from "@/components/Intro";
import { HomeFinder } from "@/components/HomeFinder";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const published = store.cars.filter((car) => car.published);
  const staff = [...store.staff].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <Intro />
      <Header />
      <HomeFinder cars={published} />
      <Footer staff={staff} />
    </>
  );
}
