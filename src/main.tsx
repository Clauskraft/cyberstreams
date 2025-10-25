import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense
        fallback={
          <div
            className="flex items-center justify-center py-20"
            data-testid="loading-spinner"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
          </div>
        }
      >
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
