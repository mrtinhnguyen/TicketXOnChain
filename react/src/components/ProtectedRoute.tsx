import { useOutletContext, Navigate, Outlet } from "react-router-dom"
import { useMetaMask } from "~/hooks/useMetaMask"

function ProtectedRoute() {
  const { signedIn } = useMetaMask()
  const context = useOutletContext<any>()

  return !signedIn ? (
    <Navigate
      to="/"
      replace
      state={{
        message: "Musisz być zalogowany, aby kontynuować",
      }}
    />
  ) : (
    <Outlet context={context} />
  )
}

export default ProtectedRoute
