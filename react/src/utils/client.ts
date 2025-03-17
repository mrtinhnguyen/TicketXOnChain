import OpenAPIClientAxios from "openapi-client-axios"
import type { Client as EventTicketingAppClient } from "~/utils/types/openapi.d.ts"

const api = new OpenAPIClientAxios({
  definition: import.meta.env.VITE_BACKEND_BASE_URL,
})
const client = await api.init<EventTicketingAppClient>()

export default client
