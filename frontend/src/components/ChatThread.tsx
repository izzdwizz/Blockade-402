import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, SessionStatus } from "../hooks/useChatSession";

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "assistant") {
    return (
      <div className="message-bubble message-bubble--assistant markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    );
  }

  return <div className="message-bubble message-bubble--user">{message.content}</div>;
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
