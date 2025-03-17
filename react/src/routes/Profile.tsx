import { useState, useEffect } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { Tag } from "primereact/tag"
import { ProgressSpinner } from "primereact/progressspinner"
import { useLocation, useOutletContext } from "react-router-dom"
import QRCode from "react-qr-code"
import { formatChainAsNum, userRoleToString } from "~/utils"
import { useMetaMask } from "~/hooks/useMetaMask"
import { Button } from "primereact/button"
import EditUserDetailsDialog from "~/components/user/EditUserDetailsDialog"

function Profile() {
  const location = useLocation()
  const { message } = location.state || {}
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()
  const { wallet, user, revalidateMe } = useMetaMask()

  const [editUserDetailsVisible, setEditUserDetailsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      toast.current?.show({
        severity: "warn",
        summary: "Komunikat ostrzeżenia",
        detail: message,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  return (
    <>
      <h2 className="mt-0">Panel użytkownika</h2>
      {user ? (
        <div className="grid">
          <div className="col-12 md:col-6 mb-5 md:mb-0">
            <p>Adres email: {user.email}</p>
            <p>Nazwa użytkownika: {user.username}</p>
            <p>Imię: {user.name}</p>
            <p>Nazwisko: {user.surname}</p>
            <p>Data urodzenia: {user.birthdate}</p>
            <p>
              Rola:{" "}
              <Tag icon="pi pi-user" rounded>
                {userRoleToString(user.role)}
              </Tag>
            </p>
            <p>Utworzono: {new Date(user.created).toLocaleString()}</p>
            <Button
              label="Edytuj szczegóły użytkownika"
              severity="info"
              size="small"
              icon="pi pi-file-edit"
              onClick={() => setEditUserDetailsVisible(true)}
              className="mt-3"
            />
          </div>
          <div className="col-12 md:col-6">
            {wallet.accounts.length > 0 && (
              <>
                <div className="mb-5" style={{ maxWidth: "200px", width: "100%" }}>
                  <div
                    className="p-3 border-1"
                    style={{
                      height: "auto",

                      background: "#fff",
                    }}
                  >
                    <QRCode
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      value={wallet.accounts[0]}
                    />
                  </div>
                  <div className="bg-primary border-round-xl	px-2">
                    <p
                      className="text-center"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {wallet.accounts[0]}
                    </p>
                  </div>
                </div>
                <div>Saldo portfela: {wallet.balance} ETH</div>
                <div>Identyfikator łańcucha: {formatChainAsNum(wallet.chainId)}</div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-content-center align-items-center">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        </div>
      )}
      <EditUserDetailsDialog
        revalidate={revalidateMe}
        toast={toast}
        user={user}
        header="Edytuj szczegóły użytkownika"
        visible={editUserDetailsVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setEditUserDetailsVisible(false)}
        draggable={false}
      />
    </>
  )
}

export default Profile
