import React from "react";
import type { ChatMessage } from "p2play-core";
import { TextChatPanel } from "p2play-core/chat";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, disabled }) => {
  return (
    <TextChatPanel
      messages={messages}
      onSend={onSendMessage}
      title="Discussion des Espions"
      placeholder="Déductions, bluffs, alliance ?..."
      emptyLabel="Aucun message. Coordonnez-vous en secret..."
      disabled={disabled}
      disabledNotice="Chat textuel désactivé (Anti-triche)."
      className="flex flex-col h-72 bg-zinc-900/60 border border-zinc-700/60 rounded-xl p-3 overflow-hidden text-zinc-100 font-sans"
      scrollbarAccent="amber"
    />
  );
};