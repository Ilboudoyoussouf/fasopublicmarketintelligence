import Anthropic from "@anthropic-ai/sdk";

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Génération contrainte : le modèle ne doit synthétiser qu'à partir du
 * contexte fourni et ne jamais inventer de faits (section 90, anti-hallucination).
 * Sans clé API configurée, retourne null — l'appelant bascule alors sur une
 * réponse déterministe construite uniquement à partir des données récupérées.
 */
export async function generateGroundedAnswer(question: string, contextText: string): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    system:
      "Tu es l'assistant de FASO Market Intelligence. Réponds UNIQUEMENT à partir du CONTEXTE fourni, en français, " +
      "de façon concise et factuelle. Si l'information demandée n'est pas dans le contexte, dis explicitement " +
      "« Information non trouvée dans les sources disponibles. » N'invente jamais de montant, de date ou de nom. " +
      "Ne présente jamais un score ou une recommandation comme une décision officielle.",
    messages: [{ role: "user", content: `CONTEXTE :\n${contextText}\n\nQUESTION : ${question}` }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : null;
}
