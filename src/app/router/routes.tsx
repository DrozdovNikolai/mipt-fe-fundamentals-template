import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AsyncFallback } from "../../components/ui/AsyncFallback";

interface AppRoutesProps {
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

const HomeRoute = lazy(() => import("./HomeRoute"));
const ChatRoute = lazy(() => import("./ChatRoute"));

const routeFallback = (
  <AsyncFallback
    description="Подгружаем маршрут и данные интерфейса."
    title="Загрузка экрана"
  />
);

export function AppRoutes(props: AppRoutesProps) {
  return (
    <Routes>
      <Route
        element={
          <Suspense fallback={routeFallback}>
            <HomeRoute {...props} />
          </Suspense>
        }
        path="/"
      />
      <Route
        element={
          <Suspense fallback={routeFallback}>
            <ChatRoute {...props} />
          </Suspense>
        }
        path="/chat/:id"
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
