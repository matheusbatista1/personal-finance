export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-background relative flex min-h-screen items-stretch overflow-hidden">
      <div
        aria-hidden
        className="floating-orb bg-primary-container absolute top-[-100px] left-[-100px] h-[500px] w-[500px]"
      />
      <div
        aria-hidden
        className="floating-orb bg-secondary-container absolute right-[-100px] bottom-[-100px] h-[400px] w-[400px]"
        style={{ animationDelay: "-5s" }}
      />

      <main className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        <BrandSide />
        <section className="p-margin-mobile md:p-xl relative flex flex-1 items-center justify-center">
          <div className="top-md left-md absolute md:hidden">
            <h1 className="text-headline-lg text-on-surface font-sans font-bold tracking-tight">
              FinLux
            </h1>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}

function BrandSide() {
  return (
    <section className="p-xl relative hidden flex-1 items-center justify-center overflow-hidden md:flex">
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(138, 43, 226, 0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 70% 80%, rgba(86, 50, 155, 0.18) 0%, transparent 70%), linear-gradient(135deg, #1a0033 0%, #0a0a0a 70%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0 60px, rgba(220, 184, 255, 0.06) 60px 61px), repeating-linear-gradient(-115deg, transparent 0 60px, rgba(220, 184, 255, 0.04) 60px 61px)",
        }}
      />

      <div
        aria-hidden
        className="from-background absolute inset-0 z-0 bg-gradient-to-tr via-transparent to-transparent"
      />

      <div className="reveal-anim relative z-10 text-center" style={{ animationDelay: "0.2s" }}>
        <h1 className="text-display-lg text-on-surface mb-xs font-sans font-bold tracking-tighter">
          FinLux
        </h1>
        <p className="text-label-md text-primary font-mono tracking-[0.2em] uppercase">
          Digital Luxury Finance
        </p>
        <div className="mt-lg gap-md flex justify-center">
          <div className="glass-panel px-md py-sm rounded-xl">
            <span className="text-label-sm text-on-surface-variant block font-mono">
              Trusted by
            </span>
            <span className="text-headline-md text-on-surface font-sans font-semibold">
              50k+ VIPs
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
