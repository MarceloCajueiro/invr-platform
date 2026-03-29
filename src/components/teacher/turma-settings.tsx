"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTurmaSettings, deleteTurma } from "@/lib/actions/turmas";

interface TurmaSettingsData {
  id: string;
  notifyNewLesson: boolean;
  notifyNewTask: boolean;
}

interface TurmaSettingsProps {
  settings: TurmaSettingsData;
}

export function TurmaSettings({ settings }: TurmaSettingsProps) {
  const updateWithId = updateTurmaSettings.bind(null, settings.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Notificações
          </h3>
          <form action={updateWithId} className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifyNewLesson"
                defaultChecked={settings.notifyNewLesson}
                className="w-4 h-4 rounded border-border text-aulas focus:ring-aulas"
              />
              <div>
                <p className="text-sm text-text-primary">Novas aulas</p>
                <p className="text-xs text-text-muted">
                  Notificar alunos quando uma nova aula for vinculada
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifyNewTask"
                defaultChecked={settings.notifyNewTask}
                className="w-4 h-4 rounded border-border text-aulas focus:ring-aulas"
              />
              <div>
                <p className="text-sm text-text-primary">Novas tarefas</p>
                <p className="text-xs text-text-muted">
                  Notificar alunos quando uma nova tarefa for vinculada
                </p>
              </div>
            </label>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm">
                Salvar Configurações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-error/30">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-error mb-2">
            Zona de Perigo
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Ao excluir esta turma, todos os vínculos com alunos, aulas e tarefas
            serão removidos. Esta ação não pode ser desfeita.
          </p>
          <form action={deleteTurma}>
            <input type="hidden" name="id" value={settings.id} />
            <Button variant="danger" size="sm" type="submit">
              Excluir Turma
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
