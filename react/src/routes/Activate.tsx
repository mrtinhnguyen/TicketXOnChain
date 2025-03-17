import { useEffect } from "react"
import type { RefObject } from "react"
import { Toast } from "primereact/toast"
import { useParams, useNavigate, useOutletContext, Navigate } from "react-router-dom"
import axios from "axios"
import type { AxiosError } from "axios"
import client from "~/utils/client"
import { ProgressSpinner } from "primereact/progressspinner"
import { useMetaMask } from "~/hooks/useMetaMask"

function Activate() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const { signedIn } = useMetaMask()

  useEffect(() => {
    const handleActivateUser = async () => {
      try {
        await client.ActivateUser(undefined, { activationToken: token! })
        toast.current?.show({
          severity: "success",
          summary: "Komunikat o powodzeniu",
          detail: "Konto użytkownika zostało pomyślnie aktywowane",
        })
        navigate("/", { replace: true })
      } catch (error: any) {
        console.error(error)
        if (axios.isAxiosError(error)) {
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: (error as AxiosError<{ message?: string }>).response?.data.message,
          })
          navigate("/", { replace: true })
        }
      }
    }

    if (!signedIn) {
      handleActivateUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return signedIn ? (
    <Navigate to="/" replace />
  ) : (
    <div className="flex justify-content-center align-items-center">
      <ProgressSpinner style={{ width: "50px", height: "50px" }} />
    </div>
  )
}

export default Activate
