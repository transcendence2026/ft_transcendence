export default function LoginLeftSide() {
  return (
    <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#0f0e0d] px-10 py-6 lg:flex xl:px-14">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#ffb4a1]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#bd8718]/15 blur-[55px]" />

      <header className="relative z-10 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e0bfb7]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ffb4a1]" />
          Epicure Atelier · SVR.04
        </span>
        <span className="rounded-xl bg-[#211f1e]/80 px-3 py-1.5 normal-case tracking-normal text-[#e6e1df] shadow-sm">
          ✦ 3-Star Michelin Curation
        </span>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center py-4">
        <figure className="relative flex h-[55vh] max-h-95 w-[min(32vw,360px)] items-center justify-center transition-transform duration-500 hover:scale-[1.02]">
          <figcaption className="absolute -left-12 top-0 z-20 rotate-3 rounded-xl bg-[#2b2a28]/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#fabc4d] shadow-xl backdrop-blur-sm">
            ● Wagyu brioche reserve
          </figcaption>

          <img
            src="/images/burger.png"
            alt="Artisanal wagyu brioche burger"
            className="h-full w-full rounded-lg bg-[#1d1b1a] object-cover opacity-90 shadow-[0_30px_35px_rgba(0,0,0,.85)] transition-opacity hover:opacity-100"
          />

          <figcaption className="absolute -bottom-4 -right-8 z-20 rotate-2 rounded-xl bg-[#2b2a28]/95 px-3 py-1.5 text-[11px] text-[#e6e1df] shadow-xl backdrop-blur-sm">
            ♨ Smoked Emmental &amp; Pimento Relish
          </figcaption>
        </figure>
      </div>

      <footer className="relative z-10 flex items-end justify-between gap-6">
        <div>
          <p className="max-w-md text-xl leading-snug italic text-[#e6e1df]">
            “An ode to obsessive craft and sensory gastronomy.”
          </p>
          <p className="mt-1.5 text-[11px] tracking-wide text-[#a88a83]">
            Chef Nicolas Laurent · Gastronomy &amp; Cellar Residency, Kyoto
            &amp; Paris
          </p>
        </div>
        <div className="mb-1 flex gap-1.5">
          <span className="h-1 w-7 rounded-full bg-[#ffb4a1]" />
          <span className="h-1 w-2 rounded-full bg-[#363433]" />
          <span className="h-1 w-2 rounded-full bg-[#363433]" />
        </div>
      </footer>
    </section>
  );
}
