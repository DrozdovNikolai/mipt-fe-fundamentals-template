import { ChatWindow } from "./ChatWindow";
interface ChatSessionProps {
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

export function ChatSession({ onOpenSettings, onOpenSidebar }: ChatSessionProps) {
  return (
    <ChatWindow onOpenSettings={onOpenSettings} onOpenSidebar={onOpenSidebar} />
  );
}
