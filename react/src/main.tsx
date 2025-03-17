import React, { useEffect } from "react"
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom"
import ReactDOM from "react-dom/client"
import App from "~/App.tsx"

import * as Sentry from "@sentry/react"

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

if (import.meta.env.PROD && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/^\//, BACKEND_BASE_URL!],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
