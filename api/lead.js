// Vercel serverless function (Node runtime, zero-config /api route).
// Recebe o cadastro do formulário e notifica via Telegram — evita perder o lead
// (antes o formulário só validava e mostrava sucesso, sem enviar os dados a lugar nenhum).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const { nome, email, whatsapp, interesse } = req.body ?? {};

  if (!nome || !email || !whatsapp) {
    res.status(400).json({ error: "campos obrigatórios ausentes" });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    const text =
      `🆕 <b>Novo cadastro — Família em Rumo Financeiro</b>\n` +
      `👤 ${escapeHtml(nome)}\n` +
      `✉️ ${escapeHtml(email)}\n` +
      `📱 ${escapeHtml(whatsapp)}\n` +
      (interesse ? `🏷️ ${escapeHtml(interesse)}` : "");

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
    } catch {
      // Não bloqueia a resposta ao usuário se o Telegram falhar.
    }
  }

  res.status(200).json({ ok: true });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}
