import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { requestAssistantCompletion, type GigaChatMessage } from "../../api/gigachat";
import { defaultSettings, mockChats } from "../../data/mockData";
import {
  loadAuthSession,
  loadPersistedChatState,
  saveAuthSession,
  savePersistedChatState,
} from "../../utils/storage";
import type {
  AuthFormValues,
  ChatAction,
  ChatData,
  ChatState,
  MessageData,
  MessageVariant,
  SettingsData,
} from "../../types/chat";

interface ChatContextValue {
  state: ChatState;
  activeChat: ChatData | null;
  login: (values: AuthFormValues) => void;
  logout: () => void;
  updateSettings: (settings: SettingsData) => void;
  setActiveChatId: (chatId: string | null) => void;
  createChat: () => string;
  renameChat: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<string | null>;
  reloadLastResponse: () => Promise<void>;
  stopGeneration: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const DEFAULT_CHAT_TITLE = "Новый чат";
const EMPTY_PREVIEW = "Сообщений пока нет.";

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const truncateText = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatMessageTime = (timestamp: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const resolveAuthor = (role: MessageVariant) => (role === "assistant" ? "GigaChat" : "Вы");

const buildMessage = (role: MessageVariant, content: string, timestamp = new Date().toISOString()): MessageData => ({
  id: generateId(),
  role,
  content,
  author: resolveAuthor(role),
  createdAt: formatMessageTime(timestamp),
  timestamp,
});

const buildPreview = (messages: MessageData[]) => {
  const lastMessage = [...messages]
    .reverse()
    .find((message) => collapseWhitespace(message.content).length > 0);

  if (!lastMessage) {
    return EMPTY_PREVIEW;
  }

  return truncateText(collapseWhitespace(lastMessage.content), 76);
};

const buildUpdatedAt = (messages: MessageData[]) => {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.createdAt ?? "Сейчас";
};

const buildFallbackTitle = (chats: ChatData[]) => {
  const untitledCount = chats.filter(
    (chat) => chat.isTitleGenerated && (chat.title === DEFAULT_CHAT_TITLE || chat.title.startsWith("Диалог ")),
  ).length;

  return untitledCount === 0 ? DEFAULT_CHAT_TITLE : `Диалог ${untitledCount + 1}`;
};

const buildGeneratedTitle = (content: string, chats: ChatData[]) => {
  const normalizedContent = collapseWhitespace(content);
  if (normalizedContent.length >= 6) {
    return truncateText(normalizedContent, 38);
  }

  return buildFallbackTitle(chats);
};

const syncChatDerivedFields = (chat: ChatData, chats: ChatData[]) => {
  const firstUserMessage = chat.messages.find(
    (message) => message.role === "user" && collapseWhitespace(message.content).length > 0,
  );

  const nextTitle =
    chat.isTitleGenerated === false
      ? chat.title
      : firstUserMessage
        ? buildGeneratedTitle(firstUserMessage.content, chats)
        : chat.title || buildFallbackTitle(chats);

  return {
    ...chat,
    title: nextTitle,
    isTitleGenerated: chat.isTitleGenerated ?? true,
    updatedAt: buildUpdatedAt(chat.messages),
    preview: buildPreview(chat.messages),
  };
};

const normalizeChats = (chats: ChatData[]) => {
  const normalizedChats = chats.map<ChatData>((chat) => ({
    ...chat,
    isTitleGenerated: chat.isTitleGenerated ?? false,
    preview: chat.preview || buildPreview(chat.messages),
    updatedAt: chat.updatedAt || buildUpdatedAt(chat.messages),
    messages: chat.messages.map((message) => {
      const timestamp = message.timestamp ?? new Date().toISOString();
      return {
        ...message,
        timestamp,
        author: message.author || resolveAuthor(message.role),
        createdAt: message.createdAt || formatMessageTime(timestamp),
      };
    }),
  }));

  return normalizedChats.map((chat) => syncChatDerivedFields(chat, normalizedChats));
};

const buildInitialChats = () => normalizeChats(mockChats);

const buildNewChat = (chats: ChatData[]): ChatData => {
  const title = buildFallbackTitle(chats);

  return {
    id: generateId(),
    title,
    isTitleGenerated: true,
    updatedAt: "Сейчас",
    preview: EMPTY_PREVIEW,
    messages: [],
  };
};

const resolveActiveChatId = (activeChatId: string | null, chats: ChatData[]) =>
  activeChatId && chats.some((chat) => chat.id === activeChatId) ? activeChatId : null;

const updateChatCollection = (
  chats: ChatData[],
  chatId: string,
  updater: (chat: ChatData) => ChatData,
) => {
  const nextChats = chats.map((chat) => (chat.id === chatId ? updater(chat) : chat));
  return nextChats.map((chat) => (chat.id === chatId ? syncChatDerivedFields(chat, nextChats) : chat));
};

const initialPersistedState = loadPersistedChatState();
const initialChats = normalizeChats(initialPersistedState?.chats ?? buildInitialChats());

export const initialChatState: ChatState = {
  chats: initialChats,
  activeChatId: resolveActiveChatId(initialPersistedState?.activeChatId ?? initialChats[0]?.id ?? null, initialChats),
  isLoading: false,
  error: null,
  authSession: loadAuthSession(),
  settings: initialPersistedState?.settings ?? defaultSettings,
};

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "HYDRATE": {
      const chats = normalizeChats(action.payload.chats);
      return {
        ...state,
        chats,
        settings: action.payload.settings,
        authSession: action.payload.authSession,
        activeChatId: resolveActiveChatId(action.payload.activeChatId, chats),
      };
    }

    case "SET_AUTH_SESSION":
      return {
        ...state,
        authSession: action.payload,
      };

    case "SET_SETTINGS":
      return {
        ...state,
        settings: action.payload,
      };

    case "SET_ACTIVE_CHAT":
      return {
        ...state,
        activeChatId: resolveActiveChatId(action.payload, state.chats),
      };

    case "CREATE_CHAT":
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        activeChatId: action.payload.id,
        error: null,
      };

    case "RENAME_CHAT":
      return {
        ...state,
        chats: updateChatCollection(state.chats, action.payload.chatId, (chat) => ({
          ...chat,
          title: action.payload.title.trim(),
          isTitleGenerated: false,
        })),
      };

    case "DELETE_CHAT": {
      const nextChats = state.chats.filter((chat) => chat.id !== action.payload.chatId);
      const nextActiveChatId =
        state.activeChatId === action.payload.chatId ? null : resolveActiveChatId(state.activeChatId, nextChats);

      return {
        ...state,
        chats: nextChats,
        activeChatId: nextActiveChatId,
      };
    }

    case "APPEND_MESSAGE":
      return {
        ...state,
        chats: updateChatCollection(state.chats, action.payload.chatId, (chat) => ({
          ...chat,
          messages: [...chat.messages, action.payload.message],
        })),
      };

    case "APPEND_MESSAGE_CONTENT":
      return {
        ...state,
        chats: updateChatCollection(state.chats, action.payload.chatId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === action.payload.messageId
              ? { ...message, content: message.content + action.payload.content }
              : message,
          ),
        })),
      };

    case "SET_MESSAGE_CONTENT":
      return {
        ...state,
        chats: updateChatCollection(state.chats, action.payload.chatId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === action.payload.messageId
              ? { ...message, content: action.payload.content }
              : message,
          ),
        })),
      };

    case "REMOVE_MESSAGE":
      return {
        ...state,
        chats: updateChatCollection(state.chats, action.payload.chatId, (chat) => ({
          ...chat,
          messages: chat.messages.filter((message) => message.id !== action.payload.messageId),
        })),
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};

type StoredRequest = {
  chatId: string;
  messages: GigaChatMessage[];
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError";

const buildApiMessages = (messages: MessageData[], systemPrompt: string) => {
  const requestMessages: GigaChatMessage[] = [];

  if (collapseWhitespace(systemPrompt)) {
    requestMessages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  for (const message of messages) {
    if (!collapseWhitespace(message.content)) {
      continue;
    }

    requestMessages.push({
      role: message.role,
      content: message.content,
    });
  }

  return requestMessages;
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<StoredRequest | null>(null);

  useEffect(() => {
    savePersistedChatState({
      chats: state.chats,
      activeChatId: state.activeChatId,
      settings: state.settings,
    });
  }, [state.activeChatId, state.chats, state.settings]);

  useEffect(() => {
    saveAuthSession(state.authSession);
  }, [state.authSession]);

  const login = (values: AuthFormValues) => {
    dispatch({
      type: "SET_AUTH_SESSION",
      payload: values,
    });
  };

  const logout = () => {
    dispatch({
      type: "SET_AUTH_SESSION",
      payload: null,
    });
  };

  const updateSettings = (settings: SettingsData) => {
    dispatch({
      type: "SET_SETTINGS",
      payload: settings,
    });
  };

  const setActiveChatId = (chatId: string | null) => {
    dispatch({
      type: "SET_ACTIVE_CHAT",
      payload: chatId,
    });
  };

  const createChat = () => {
    const chat = buildNewChat(state.chats);
    dispatch({
      type: "CREATE_CHAT",
      payload: chat,
    });
    return chat.id;
  };

  const renameChat = (chatId: string, title: string) => {
    const nextTitle = collapseWhitespace(title);
    if (!nextTitle) {
      return;
    }

    dispatch({
      type: "RENAME_CHAT",
      payload: {
        chatId,
        title: nextTitle,
      },
    });
  };

  const deleteChat = (chatId: string) => {
    if (lastRequestRef.current?.chatId === chatId) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      lastRequestRef.current = null;
      dispatch({
        type: "SET_LOADING",
        payload: false,
      });
    }

    dispatch({
      type: "DELETE_CHAT",
      payload: {
        chatId,
      },
    });
  };

  const runAssistantRequest = async (chatId: string, requestMessages: GigaChatMessage[]) => {
    if (!state.authSession) {
      dispatch({
        type: "SET_ERROR",
        payload: "Сначала войдите по credentials GigaChat.",
      });
      return;
    }

    const assistantMessage = buildMessage("assistant", "");
    let hasStreamedContent = false;

    dispatch({
      type: "APPEND_MESSAGE",
      payload: {
        chatId,
        message: assistantMessage,
      },
    });
    dispatch({
      type: "SET_LOADING",
      payload: true,
    });
    dispatch({
      type: "SET_ERROR",
      payload: null,
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    lastRequestRef.current = {
      chatId,
      messages: requestMessages,
    };

    try {
      const fullText = await requestAssistantCompletion({
        authSession: state.authSession,
        settings: state.settings,
        messages: requestMessages,
        signal: abortController.signal,
        onChunk: (chunk) => {
          hasStreamedContent = true;
          startTransition(() => {
            dispatch({
              type: "APPEND_MESSAGE_CONTENT",
              payload: {
                chatId,
                messageId: assistantMessage.id,
                content: chunk,
              },
            });
          });
        },
      });

      if (!hasStreamedContent) {
        dispatch({
          type: "SET_MESSAGE_CONTENT",
          payload: {
            chatId,
            messageId: assistantMessage.id,
            content: fullText,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: "REMOVE_MESSAGE",
        payload: {
          chatId,
          messageId: assistantMessage.id,
        },
      });

      if (isAbortError(error)) {
        return;
      }

      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Не удалось получить ответ GigaChat.",
      });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }

      dispatch({
        type: "SET_LOADING",
        payload: false,
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!collapseWhitespace(content) || state.isLoading) {
      return state.activeChatId;
    }

    let chat = state.chats.find((item) => item.id === state.activeChatId) ?? null;
    let chatId = chat?.id ?? null;

    if (!chat || !chatId) {
      chat = buildNewChat(state.chats);
      chatId = chat.id;
      dispatch({
        type: "CREATE_CHAT",
        payload: chat,
      });
    }

    const userMessage = buildMessage("user", content);

    dispatch({
      type: "APPEND_MESSAGE",
      payload: {
        chatId,
        message: userMessage,
      },
    });

    const requestMessages = buildApiMessages([...chat.messages, userMessage], state.settings.systemPrompt);
    await runAssistantRequest(chatId, requestMessages);

    return chatId;
  };

  const reloadLastResponse = async () => {
    if (!lastRequestRef.current || state.isLoading) {
      return;
    }

    const { chatId, messages } = lastRequestRef.current;
    await runAssistantRequest(chatId, messages);
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({
      type: "SET_LOADING",
      payload: false,
    });
  };

  const activeChat = state.activeChatId
    ? state.chats.find((chat) => chat.id === state.activeChatId) ?? null
    : null;

  return (
    <ChatContext.Provider
      value={{
        state,
        activeChat,
        login,
        logout,
        updateSettings,
        setActiveChatId,
        createChat,
        renameChat,
        deleteChat,
        sendMessage,
        reloadLastResponse,
        stopGeneration,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatStore = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatStore must be used within ChatProvider");
  }

  return context;
};
