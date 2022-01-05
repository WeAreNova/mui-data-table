import React, { ReactNode } from "react";
import { createDTError, DataTableError } from "utils";

interface ErrorBoundaryProps {
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: null | DataTableError;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.isDataTableError ? error : createDTError(error?.message) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? "Something went wrong";
    return this.props.children;
  }
}

export default ErrorBoundary;
