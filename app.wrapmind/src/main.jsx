import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { apolloClient } from './lib/apolloClient'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `app.wrapmind@${import.meta.env.VITE_APP_VERSION ?? '0.0.0'}`,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// ── One-time localStorage migration ──────────────────────────────────────────
// CustomerContext previously stored override patches (an object) under the
// same key CustomersPage uses for the customer array. If bad data is present,
// remove it so the page falls back to seed data cleanly.
;(function migrateCustomerStorage() {
  try {
    const raw = localStorage.getItem('wm-customers-v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('wm-customers-v1');
      }
    }
  } catch {
    localStorage.removeItem('wm-customers-v1');
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)
