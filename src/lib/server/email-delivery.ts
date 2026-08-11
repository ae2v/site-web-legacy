export type EmailDeliveryStatus = "ENVOYE" | "EN_ATTENTE_ENVOI" | "ERREUR";

export type EmailDeliveryInput = {
  recipient: string;
  sender: string;
  subject: string;
  body: string;
};

function plainTextFromHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Transport serveur sans dépendance : Resend est utilisé lorsqu'une clé est
 * configurée dans Vercel. Sans clé, le message reste explicitement en attente
 * d'envoi au lieu d'être présenté comme envoyé.
 */
export async function deliverEmail(
  input: EmailDeliveryInput,
): Promise<{ status: EmailDeliveryStatus; error?: string }> {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  if (!apiKey) {
    return {
      status: "EN_ATTENTE_ENVOI",
      error: "RESEND_API_KEY non configurée : le message est conservé dans la file d’attente.",
    };
  }

  const from = process.env["EMAIL_FROM"]?.trim() || input.sender;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.recipient],
        reply_to: input.sender,
        subject: input.subject,
        html: input.body,
        text: plainTextFromHtml(input.body),
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      return { status: "ERREUR", error: `Resend ${response.status}: ${detail}` };
    }
    return { status: "ENVOYE" };
  } catch (error) {
    return {
      status: "ERREUR",
      error: error instanceof Error ? error.message : "Transport email indisponible",
    };
  }
}
