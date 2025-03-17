import { PrimeReactProvider } from "primereact/api"
import Router from "~/Router"
import { MetaMaskContextProvider } from "~/hooks/useMetaMask"
import client from "~/utils/client"

import "primereact/resources/themes/lara-light-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeflex/primeflex.css"
import "primeicons/primeicons.css"
import "~/App.global.css"

client.defaults.baseURL = import.meta.env.VITE_BACKEND_BASE_URL
const authenticationToken = localStorage.getItem("EventTicketingApp.authenticationToken")
if (authenticationToken) {
  client.defaults.headers.common["Authorization"] = `Bearer ${authenticationToken}`
}

function App() {
  return (
    <div>
      <PrimeReactProvider>
        <MetaMaskContextProvider>
          <Router />
        </MetaMaskContextProvider>
      </PrimeReactProvider>
    </div>
  )
}

export default App
