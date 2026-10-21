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
            ? `您正在詢問 ${car.make} ${car.year} ${car.model}。請選擇一位顧問，系統會帶您前往對方的 LINE 對話。請在訊息中告知車款與希望鑑賞的時段。`
            : "請選擇一位顧問開啟 LINE。若已有屬意車款，可先從庫存頁進入該車，再發起預約。"}
        </p>
        <InquiryPicker staff={staff} carLabel={car ? `${car.make} ${car.model}` : ""} />
      </main>
      <Footer staff={staff} />
    </>
  );
}
