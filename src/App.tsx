import { useEffect, useState } from "react";
import { AppRoutes } from "./app/router/routes";
import { useChatStore } from "./app/providers/ChatProvider";
import styles from "./App.module.css";
import { AuthForm } from "./components/auth/AuthForm";
import { AppLayout } from "./components/layout/AppLayout";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { Sidebar } from "./components/sidebar/Sidebar";

function App() {
  const { state, login, updateSettings } = useChatStore();
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

  const openSettings = () => {
    setDraftSettings(state.settings);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setDraftSettings(state.settings);
    setIsSettingsOpen(false);
  };

  const saveSettings = () => {
    updateSettings(draftSettings);
    setIsSettingsOpen(false);
  };

  const resetSettings = () => {
    setDraftSettings(state.settings);
  };

  return (
    <div className={styles.appRoot}>
      {!state.authSession ? (
        <AuthForm onSubmit={login} />
      ) : (
        <>
          <AppLayout
            isSidebarOpen={isSidebarOpen}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            sidebar={<Sidebar onNavigate={() => setIsSidebarOpen(false)} />}
          >
            <AppRoutes
              onOpenSettings={openSettings}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          </AppLayout>

          <SettingsPanel
            isOpen={isSettingsOpen}
            settings={draftSettings}
            onChange={setDraftSettings}
            onClose={closeSettings}
            onSave={saveSettings}
            onReset={resetSettings}
          />
        </>
      )}
    </div>
  );
}

export default App;
