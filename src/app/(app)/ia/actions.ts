"use server";

import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { askAssistant } from "@/lib/ai/assistant";

export async function askAssistantAction(question: string, conversationId?: string) {
  const { tenant, session } = await requireTenantContext();

  const conversation = conversationId
    ? await prisma.aiConversation.findFirst({ where: { id: conversationId, tenantId: tenant.id } })
    : await prisma.aiConversation.create({ data: { tenantId: tenant.id, userId: session.user.id, title: question.slice(0, 80) } });

  if (!conversation) throw new Error("Conversation introuvable");

  await prisma.aiMessage.create({ data: { conversationId: conversation.id, role: "USER", content: question } });

  const result = await askAssistant(tenant.id, question);

  const assistantMessage = await prisma.aiMessage.create({
    data: { conversationId: conversation.id, role: "ASSISTANT", content: result.answer, confidence: result.confidence },
  });
  if (result.sources.length > 0) {
    await prisma.aiSource.createMany({
      data: result.sources.map((s) => ({ messageId: assistantMessage.id, entityType: s.entityType, entityId: s.entityId, excerpt: s.excerpt })),
    });
  }

  return { conversationId: conversation.id, ...result };
}
