import type { ReactNode } from "react";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export function AppLayout({
  sidebar,
  children,
  isSidebarOpen,
  onCloseSidebar,
}: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <aside
        className={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {sidebar}
      </aside>

      <button
        aria-label="Закрыть боковую панель"
        className={[styles.backdrop, isSidebarOpen ? styles.backdropVisible : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={onCloseSidebar}
        type="button"
      />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
