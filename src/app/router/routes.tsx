import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useChatStore } from "../providers/ChatProvider";
import { ChatWindow } from "../../components/chat/ChatWindow";

interface AppRoutesProps {
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

function RoutedChatWindow(props: AppRoutesProps) {
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

export function AppRoutes(props: AppRoutesProps) {
  return (
    <Routes>
      <Route element={<ChatWindow {...props} />} path="/" />
      <Route element={<RoutedChatWindow {...props} />} path="/chat/:id" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
