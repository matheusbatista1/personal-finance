import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <>
      <Sidebar />
      <TopBar />
      <main className="max-w-container-max gap-lg p-margin-mobile md:p-lg md:pb-lg mx-auto flex min-h-screen flex-col pt-[100px] pb-32 md:ml-64 md:pt-[100px]">
        {children}
      </main>
    </>
  );
}
