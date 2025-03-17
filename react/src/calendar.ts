declare global {
  interface Window {
    gapi: any
    google: any
  }
}

export const gapi = window.gapi
export const google = window.google
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
export const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY
export const DISCOVERY_DOCS = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
export const SCOPES = "https://www.googleapis.com/auth/calendar.events"
