import type { ChatMessage, SessionStatus } from "../hooks/useChatSession";

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`message-bubble message-bubble--${message.role}`}>{message.content}</div>
  );
}

export function ChatThread({
  messages,
  status,
}: {
  messages: ChatMessage[];
  status: SessionStatus;
}) {
  return (
    <div className="chat-thread">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {status === "thinking" && (
        <div className="message-bubble message-bubble--assistant message-bubble--thinking">
          thinking…
        </div>
      )}
    </div>
  );
}
