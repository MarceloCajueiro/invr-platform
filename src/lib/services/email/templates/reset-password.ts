interface ResetPasswordEmailProps {
  url: string;
  name: string;
}

export function renderResetPasswordEmail({ url, name }: ResetPasswordEmailProps): string {
  const trimmedName = name.trim();
  const greeting = trimmedName
    ? `Olá, <strong>${escapeHtml(trimmedName)}</strong>.`
    : "Olá.";
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Redefinir sua senha</h2>
      <p style="color: #555; line-height: 1.6;">
        ${greeting} Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Inglês na Vida Real</strong>.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Clique no botão abaixo para escolher uma nova senha:
      </p>
      <a href="${url}"
         style="display: inline-block; margin-top: 16px; padding: 12px 32px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Redefinir senha
      </a>
      <p style="margin-top: 24px; color: #555; line-height: 1.6; font-size: 13px;">
        Se o botão não funcionar, copie e cole este link no navegador:<br />
        <span style="word-break: break-all; color: #6c5ce7;">${url}</span>
      </p>
      <p style="margin-top: 24px; color: #999; font-size: 13px;">
        Este link expira em 24 horas. Se você não solicitou, pode ignorar este email.
      </p>
      <p style="margin-top: 8px; color: #999; font-size: 13px;">
        — Equipe Inglês na Vida Real
      </p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
