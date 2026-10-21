import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InquiryPicker } from "@/components/InquiryPicker";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ car?: string }>;
}) {
  const { car: slug } = await searchParams;
  const store = await getStore();
  const staff = [...store.staff].sort((a, b) => a.sortOrder - b.sortOrder);
  const car = slug ? store.cars.find((item) => item.slug === slug && item.published) : undefined;

  return (
    <>
      <Header />
      <main className="inquiry">
        <p className="engraved">Appointment</p>
        <h1>選擇顧問</h1>
        <hr className="hairline" />
        <p className="inquiry-lead">
          {!staff.length
            ? "真實業務 LINE 尚未設定。完成設定前，網站不會顯示任何不存在或示範聯絡人。"
            : car
            ? `您正在詢問 ${car.make} ${car.year} ${car.model}。請選擇一位顧問，手機將直接打開 LINE 聊天室，並帶入車款訊息。`
            : "請選擇一位顧問。手機點擊會直接打開 LINE 聊天室；電腦則會開啟 LINE 網頁。"}
        </p>
        <InquiryPicker staff={staff} carLabel={car ? `${car.make} ${car.model}` : ""} />
      </main>
      <Footer staff={staff} />
    </>
  );
}
