import { ChatWindow } from "../../components/chat/ChatWindow";

interface HomeRouteProps {
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

export default function HomeRoute(props: HomeRouteProps) {
  return <ChatWindow {...props} />;
}
