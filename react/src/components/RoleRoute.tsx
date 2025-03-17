import { useOutletContext, Navigate, Outlet } from "react-router-dom"
import { useMetaMask } from "~/hooks/useMetaMask"
import type { Components } from "~/utils/types/openapi.d.ts"

function RoleRoute({ role }: { role: Components.Schemas.UserRole }) {
  const { user } = useMetaMask()
  const context = useOutletContext<any>()

  return user ? (
    !(user.role === role) ? (
      <Navigate
        to="/profile"
        replace
        state={{
          message: "Nie jesteś upoważniony do wykonania tej akcji",
        }}
      />
    ) : (
      <Outlet context={context} />
    )
  ) : null
}

export default RoleRoute
