export default function AuthSide({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  return (
    <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-background-deep px-10 py-6 lg:flex xl:px-14">
      <div
        className={`pointer-events-none absolute -top-32 h-96 w-96 rounded-full bg-primary-soft/10 blur-3xl ${
          isLeft ? "-left-32" : "-right-32"
        }`}
      />
      <div
        className={`pointer-events-none absolute top-1/2 h-125 w-125 -translate-y-1/2 rounded-full bg-secondary/15 blur-[55px] ${
          isLeft ? "left-[15%]" : "right-[15%]"
        }`}
      />

      <div
        className={`absolute top-0 h-full w-10 ${isLeft ? "bg-linear-to-l right-0" : "bg-linear-to-r left-0 "} from-background to-background-deep`}
      />

      <header className="relative z-10 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-text-soft">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-soft" />
          Proyecto 42
        </span>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center py-4">
        <figure className="relative flex h-[55vh] max-h-95 w-[min(32vw,360px)] items-center justify-center transition-transform duration-500 hover:scale-[1.02]">
          <figcaption className="absolute -left-12 top-0 z-20 rotate-3 rounded-card bg-surface-raised/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-secondary shadow-xl backdrop-blur-sm">
            ● Norminette Approved
          </figcaption>

          <img
            src="/images/burger.png"
            alt="Desarrollo de software y colaboración"
            className="h-full w-full rounded-card bg-surface object-cover opacity-90 shadow-[0_30px_35px_rgba(0,0,0,.85)] transition-opacity hover:opacity-100"
          />

          <figcaption className="absolute -bottom-4 -right-8 z-20 rotate-2 rounded-card bg-surface-raised/95 px-3 py-1.5 text-[11px] text-text shadow-xl backdrop-blur-sm">
            ⚡ Evaluación Peer-to-Peer
          </figcaption>
        </figure>
      </div>

      <footer className="relative z-10 flex items-end justify-between gap-6">
        <div>
          <p className="max-w-md text-xl leading-snug italic text-text">
            “El verdadero aprendizaje nace de la perseverancia, los errores y la
            colaboración constante.”
          </p>
          <p className="mt-1.5 text-[11px] tracking-wide text-muted">
            Campus 42 · Desarrollo de Software & Arquitectura de Sistemas
          </p>
        </div>
        <div className="mb-1 flex gap-1.5">
          <span className="h-1 w-7 rounded-full bg-primary-soft" />
          <span className="h-1 w-2 rounded-full bg-border" />
          <span className="h-1 w-2 rounded-full bg-border" />
        </div>
      </footer>
    </section>
  );
}
