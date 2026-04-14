import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { useChatStore } from "../providers/ChatProvider";

interface ChatRouteProps {
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

export default function ChatRoute(props: ChatRouteProps) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { state, setActiveChatId } = useChatStore();

  useEffect(() => {
    if (!chatId) {
      return;
    }

    const hasChat = state.chats.some((chat) => chat.id === chatId);
    if (!hasChat) {
      navigate("/", { replace: true });
      return;
    }

    setActiveChatId(chatId);
  }, [chatId, navigate, setActiveChatId, state.chats]);

  return <ChatWindow {...props} />;
}
