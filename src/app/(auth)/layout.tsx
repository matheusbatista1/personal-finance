export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <div className="bg-primary-container absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full blur-[120px]" />
        <div className="bg-secondary-container absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full blur-[100px]" />
      </div>
      <div className="p-margin-mobile md:p-lg relative z-10 flex min-h-screen items-center justify-center">
        {children}
      </div>
    </div>
  );
}
