import { useEffect, memo, useState } from "react"
import type { RefObject } from "react"
import { Link } from "react-router-dom"
import { Button } from "primereact/button"
import { Toast } from "primereact/toast"
import { Menubar } from "primereact/menubar"
import { useNavigate } from "react-router-dom"
import { formatAddress } from "~/utils"
import { useMetaMask } from "~/hooks/useMetaMask"
import optimismLogo from "~/assets/optimism-ethereum-op-logo.svg"

const start = (
  <Link to="/" className="mr-3 text-white" aria-label="Strona główna">
    <i className="pi pi-ticket" style={{ fontSize: "2.5rem" }}></i>
  </Link>
)

const Header = memo(function ({ toast }: { toast: RefObject<Toast> }) {
  const navigate = useNavigate()
  const {
    wallet,
    hasProvider,
    error,
    errorMessage,
    connecting,
    switching,
    networkUnsupported,
    signingIn,
    signedIn,
    connectMetaMask,
    switchNetwork,
    signIn,
    signOut,
  } = useMetaMask()

  const handleSwitchNetwork = () => switchNetwork()
  const handleConnectMetaMask = () => connectMetaMask()
  const handleUserNotFound = (token: string) => {
    toast.current?.show({
      severity: "warn",
      summary: "Komunikat ostrzeżenia",
      detail: "Twoje konto nie zostało odnalezione. Zarejestruj się, aby kontynuować",
    })
    navigate("/sign-up", { state: { token } })
  }
  const handleSignIn = () => signIn(handleUserNotFound)
  const handleSignOut = () => {
    signOut()
    navigate("/")
  }

  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Komunikat o błędzie",
        detail: errorMessage,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage])

  useEffect(() => {
    if (wallet.accounts.length > 0) {
      toast.current?.show({
        severity: "success",
        summary: "Komunikat o powodzeniu",
        detail: "Połączono z portfelem",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet])

  const initialItems = [
    {
      label: "Strona główna",
      icon: "pi pi-home",
      command: () => {
        navigate("/")
      },
    },
    {
      label: "Artyści",
      icon: "pi pi-star",
      command: () => {
        navigate("/artists")
      },
    },
  ]

  const [items, setItems] = useState<any[]>(initialItems)

  useEffect(() => {
    if (signedIn) {
      const newItems = [...initialItems]

      newItems.push({
        label: "Profil",
        icon: "pi pi-user",
        command: () => {
          navigate("/profile")
        },
      })

      setItems(newItems)
    } else {
      setItems(initialItems)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn])

  const end = (
    <div className="flex flex-wrap justify-content-end align-items-center">
      <div className="flex flex-wrap align-items-center">
        {hasProvider === false && (
          <a href="https://metamask.io" className="text-white" rel="noreferrer" target="_blank">
            Zainstaluj MetaMask
          </a>
        )}
        {window.ethereum?.isMetaMask &&
          (wallet.accounts.length === 0 ? (
            <>
              {networkUnsupported ? (
                <Button
                  label="Przełącz sieć"
                  icon="pi pi-refresh"
                  severity="info"
                  onClick={handleSwitchNetwork}
                  loading={switching}
                  size="small"
                />
              ) : (
                <Button
                  label="Podłącz portfel"
                  icon="pi pi-link"
                  severity="danger"
                  onClick={handleConnectMetaMask}
                  loading={connecting}
                  size="small"
                />
              )}
            </>
          ) : (
            <Button
              label="Odłącz portfel"
              icon="pi pi-sign-out"
              severity="info"
              className="ml-2"
              onClick={handleSignOut}
              size="small"
            />
          ))}
        {wallet.accounts.length > 0 && !signedIn && (
          <Button
            label="Zaloguj się"
            icon="pi pi-sign-in"
            severity="success"
            size="small"
            onClick={handleSignIn}
            loading={signingIn}
            className="ml-2"
          />
        )}
      </div>
      {hasProvider && wallet.accounts.length > 0 && (
        <a
          href={`https://optimistic.etherscan.io/address/${wallet.accounts[0]}`}
          rel="noreferrer"
          target="_blank"
          className="text-white ml-2"
          aria-label="Adres portfela kryptowalut"
        >
          {formatAddress(wallet.accounts[0])}
        </a>
      )}
      <a
        href="https://www.optimism.io"
        rel="noreferrer"
        target="_blank"
        className="ml-2 mt-1"
        aria-label="Sieć Optimism"
      >
        <img
          src={optimismLogo}
          className="bg-white border-round-md p-1"
          style={{ width: "2.4rem" }}
        />
      </a>
    </div>
  )

  return (
    <div className="col-12 bg-gray-900 -mb-8 z-1" data-cy="header">
      <Menubar
        model={items}
        start={start}
        end={end}
        className="flex-wrap p-3 bg-gray-900 border-noround border-none mx-auto"
        style={{
          maxWidth: "1440px",
        }}
      />
    </div>
  )
})

export default Header
