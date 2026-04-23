import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AppRoutes } from "./app/router/routes";
import { useChatStore } from "./app/providers/ChatProvider";
import styles from "./App.module.css";
import { AuthForm } from "./components/auth/AuthForm";
import { AppLayout } from "./components/layout/AppLayout";
import { AsyncFallback } from "./components/ui/AsyncFallback";

const Sidebar = lazy(() =>
  import("./components/sidebar/Sidebar").then((module) => ({
    default: module.Sidebar,
  })),
);

const SettingsPanel = lazy(() =>
  import("./components/settings/SettingsPanel").then((module) => ({
    default: module.SettingsPanel,
  })),
);

function App() {
  const { login, state, updateSettings } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draftSettings, setDraftSettings] = useState(state.settings);
  const appliedTheme = isSettingsOpen ? draftSettings.theme : state.settings.theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", appliedTheme);
  }, [appliedTheme]);

  useEffect(() => {
    if (!isSettingsOpen) {
      setDraftSettings(state.settings);
    }
  }, [isSettingsOpen, state.settings]);

  const openSettings = useCallback(() => {
    setDraftSettings(state.settings);
    setIsSettingsOpen(true);
  }, [state.settings]);

  const closeSettings = useCallback(() => {
    setDraftSettings(state.settings);
    setIsSettingsOpen(false);
  }, [state.settings]);

  const saveSettings = useCallback(() => {
    updateSettings(draftSettings);
    setIsSettingsOpen(false);
  }, [draftSettings, updateSettings]);

  const resetSettings = useCallback(() => {
    setDraftSettings(state.settings);
  }, [state.settings]);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  if (!state.authSession) {
    return <AuthForm onSubmit={login} />;
  }

  return (
    <div className={styles.appRoot}>
      <AppLayout
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={closeSidebar}
        sidebar={
          <Suspense
            fallback={
              <AsyncFallback
                description="Подгружаем список диалогов и поиск."
                title="Загрузка Sidebar"
              />
            }
          >
            <Sidebar onNavigate={closeSidebar} />
          </Suspense>
        }
      >
        <AppRoutes
          onOpenSettings={openSettings}
          onOpenSidebar={openSidebar}
        />
      </AppLayout>

      {isSettingsOpen ? (
        <Suspense
          fallback={
            <AsyncFallback
              description="Подгружаем панель настроек модели."
              title="Загрузка настроек"
            />
          }
        >
          <SettingsPanel
            isOpen={isSettingsOpen}
            settings={draftSettings}
            onChange={setDraftSettings}
            onClose={closeSettings}
            onSave={saveSettings}
            onReset={resetSettings}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

export default App;
