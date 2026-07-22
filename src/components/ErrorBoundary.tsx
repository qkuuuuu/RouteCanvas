"use client";
import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RouteCanvas ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="h-screen grid place-items-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-lg font-semibold text-gray-800 mb-2">
              应用出现异常
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message ?? "未知错误"}
            </p>
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
