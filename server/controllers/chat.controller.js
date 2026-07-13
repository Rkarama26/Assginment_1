import {
  createConversation,
  createMessage,
  getConversation,
  getRecentMessages,
  listConversations,
  listMessages,
  touchConversation,
} from "../repositories/chat.repository.js";
import { listToolCallsByWorkspace } from "../repositories/tool-call.repository.js";
import { pool } from "../config/db.js";
import { runChatWithTools } from "../chat/chat.service.js";

async function runAssistantTurn({
  workspaceId,
  conversation,
  userMessage,
  history,
  res,
}) {
  const assistantPlaceholder = await createMessage({
    conversationId: conversation.id,
    role: "assistant",
    content: "",
    citations: [],
  });

  try {
    const result = await runChatWithTools({
      workspaceId,
      userMessage,
      history,
      assistantMessageId: assistantPlaceholder.id,
    });

    await pool.query(
      `UPDATE messages SET content = $2, citations = $3 WHERE id = $1`,
      [
        assistantPlaceholder.id,
        result.content,
        JSON.stringify(result.citations),
      ],
    );

    await touchConversation(conversation.id);

    res.json({
      conversation,
      message: {
        id: assistantPlaceholder.id,
        conversation_id: conversation.id,
        role: "assistant",
        content: result.content,
        citations: result.citations,
        created_at: assistantPlaceholder.created_at,
      },
      toolCalls: result.toolCalls,
    });
  } catch (error) {
    const fallback =
      "Sorry, something went wrong generating a response. Please try again.";

    await pool.query(`UPDATE messages SET content = $2 WHERE id = $1`, [
      assistantPlaceholder.id,
      fallback,
    ]);

    res.json({
      conversation,
      message: {
        id: assistantPlaceholder.id,
        conversation_id: conversation.id,
        role: "assistant",
        content: fallback,
        citations: [],
        created_at: assistantPlaceholder.created_at,
      },
      toolCalls: [],
      error: error.message,
      canRetry: true,
    });
  }
}

export async function sendChatMessage(req, res) {
  const { message, conversationId, retry } = req.body ?? {};
  const workspaceId = req.params.workspaceId;

  if (retry && conversationId) {
    const conversation = await getConversation(conversationId, workspaceId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await listMessages(conversation.id);
    const lastUserIndex = [...messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find(({ m }) => m.role === "user")?.i;

    if (lastUserIndex === undefined) {
      return res.status(400).json({ error: "No user message to retry" });
    }

    const lastUser = messages[lastUserIndex];
    const history = messages.slice(0, lastUserIndex).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const trailing = messages.slice(lastUserIndex + 1);
    for (const msg of trailing) {
      await pool.query(`DELETE FROM messages WHERE id = $1`, [msg.id]);
    }

    return runAssistantTurn({
      workspaceId,
      conversation,
      userMessage: lastUser.content,
      history,
      res,
    });
  }

  const trimmed = message?.trim();

  if (!trimmed) {
    return res.status(400).json({ error: "Message is required" });
  }

  let conversation;

  if (conversationId) {
    conversation = await getConversation(conversationId, workspaceId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
  } else {
    const title = trimmed.slice(0, 60) + (trimmed.length > 60 ? "…" : "");
    conversation = await createConversation(workspaceId, title);
  }

  await createMessage({
    conversationId: conversation.id,
    role: "user",
    content: trimmed,
  });

  const history = await getRecentMessages(conversation.id, 8);
  const historyWithoutCurrent = history.slice(0, -1);

  return runAssistantTurn({
    workspaceId,
    conversation,
    userMessage: trimmed,
    history: historyWithoutCurrent,
    res,
  });
}

export async function getConversations(req, res) {
  const conversations = await listConversations(req.params.workspaceId);
  res.json({ conversations });
}

export async function getConversationMessages(req, res) {
  const conversation = await getConversation(
    req.params.conversationId,
    req.params.workspaceId,
  );
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  const messages = await listMessages(conversation.id);
  res.json({ conversation, messages });
}

export async function getToolCalls(req, res) {
  const toolCalls = await listToolCallsByWorkspace(req.params.workspaceId);
  res.json({ toolCalls });
}
