import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";
import styles from "./ErrorBoundary.module.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("UI rendering error captured by ErrorBoundary", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
    });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.fallback} role="alert">
        <ErrorMessage
          message={this.props.fallbackMessage ?? "Не удалось отрисовать сообщения. Попробуйте ещё раз."}
        />
        <div className={styles.actions}>
          <Button onClick={this.handleRetry} type="button">
            Повторить
          </Button>
        </div>
      </div>
    );
  }
}
