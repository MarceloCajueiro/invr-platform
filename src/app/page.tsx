export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="bg-bg-card rounded-md shadow-md p-10 max-w-md w-full animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          Fluent
        </h1>
        <p className="font-body text-text-secondary mb-6">
          Design system tokens working
        </p>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-aulas" title="Aulas" />
          <div className="w-10 h-10 rounded-full bg-tarefas" title="Tarefas" />
          <div className="w-10 h-10 rounded-full bg-fora" title="Fora" />
          <div
            className="w-10 h-10 rounded-full bg-challenges"
            title="Challenges"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-mono bg-aulas-bg text-aulas px-2 py-1 rounded-sm">
            aulas
          </span>
          <span className="text-xs font-mono bg-tarefas-bg text-tarefas px-2 py-1 rounded-sm">
            tarefas
          </span>
          <span className="text-xs font-mono bg-fora-bg text-fora px-2 py-1 rounded-sm">
            fora
          </span>
          <span className="text-xs font-mono bg-challenges-bg text-challenges px-2 py-1 rounded-sm">
            challenges
          </span>
        </div>
      </div>
    </div>
  );
}
