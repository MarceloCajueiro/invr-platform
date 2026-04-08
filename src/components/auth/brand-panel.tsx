const channels = [
  { label: "Aulas", color: "bg-aulas/20 text-aulas-light" },
  { label: "Tarefas", color: "bg-tarefas/20 text-tarefas-light" },
  { label: "Blog", color: "bg-fora/20 text-fora-light" },
  { label: "Challenges", color: "bg-challenges/20 text-challenges-light" },
];

export function BrandPanel() {
  return (
    <div className="hidden lg:flex relative w-1/2 flex-col items-center justify-center overflow-hidden bg-bg-dark">
      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 30% 20%, rgba(108, 92, 231, 0.4) 0%, transparent 60%)",
            "radial-gradient(ellipse at 70% 80%, rgba(0, 184, 148, 0.3) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 50%, rgba(108, 92, 231, 0.15) 0%, transparent 80%)",
          ].join(", "),
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-12 animate-fade-in">
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
          >
            Fluent
          </h1>
          <p className="mt-3 text-sidebar-muted text-lg">
            Plataforma inteligente de ensino de inglês
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {channels.map((ch) => (
            <span
              key={ch.label}
              className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/[0.06] ${ch.color}`}
            >
              {ch.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
