import {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
  useCallback,
} from "react"
import detectEthereumProvider from "@metamask/detect-provider"
import Web3 from "web3"
import {
  domain,
  supportedChainId,
  formatBalance,
  formatChainAsNum,
  formatChainAsHex,
} from "~/utils"
import client from "~/utils/client"
import type { Components, Paths } from "~/utils/types/openapi.d.ts"
import { SiweMessage } from "siwe"
import axios from "axios"
import type { AxiosError } from "axios"

interface WalletState {
  accounts: any[]
  balance: string
  chainId: string
}

interface MetaMaskContextData {
  wallet: WalletState
  hasProvider: boolean | null
  error: boolean
  errorMessage: string | undefined
  connecting: boolean
  switching: boolean
  networkUnsupported: boolean | null
  signingIn: boolean
  signedIn: boolean
  user: Components.Schemas.GetUser | null
  followedArtists: Components.Schemas.ListArtists | null
  clearError: () => void
  connectMetaMask: () => Promise<void>
  switchNetwork: () => Promise<void>
  signIn: (onUserNotFound: (token: string) => void) => Promise<void>
  signUp: (
    payload: Paths.SignUp.RequestBody,
    onSuccess: () => void,
    onError: (error: any) => void
  ) => Promise<void>
  signOut: () => void
  revalidateMe: () => Promise<void>
  revalidateFollowedArtists: () => Promise<void>
}

const disconnectedState: WalletState = {
  accounts: [],
  balance: "",
  chainId: "",
}

const MetaMaskContext = createContext<MetaMaskContextData>({} as MetaMaskContextData)

export const MetaMaskContextProvider = ({ children }: PropsWithChildren) => {
  const [wallet, setWallet] = useState(disconnectedState)

  const [hasProvider, setHasProvider] = useState<boolean | null>(null)

  const [connecting, setConnecting] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [networkUnsupported, setNetworkUnsupported] = useState<boolean | null>(null)

  const [signingIn, setSigningIn] = useState(false)
  const [signedIn, setSignedIn] = useState(
    client.defaults.headers.common["Authorization"] ? true : false
  )

  const [user, setUser] = useState<Components.Schemas.GetUser | null>(null)
  const [followedArtists, setFollowedArtists] = useState<Components.Schemas.ListArtists | null>(
    null
  )

  const [errorMessage, setErrorMessage] = useState<string | undefined>("")
  const clearError = () => setErrorMessage("")

  const revalidateMe = useCallback(async () => {
    setUser(null)
    const resultMe = await client.GetMe()
    setUser(resultMe.data)
    await revalidateFollowedArtists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const revalidateFollowedArtists = useCallback(async () => {
    setFollowedArtists(null)
    const resultFollowedArtists = await client.ListUserFollowedArtists()
    setFollowedArtists(resultFollowedArtists.data)
  }, [])

  const _updateWallet = useCallback(async (providedAccounts?: any) => {
    setWallet(disconnectedState)
    const accounts = providedAccounts || (await window.ethereum.request({ method: "eth_accounts" }))

    if (accounts.length === 0) {
      setWallet(disconnectedState)
      return
    }

    const balance = formatBalance(
      await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
    )
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    })

    if (formatChainAsNum(chainId) === supportedChainId) {
      window.web3 = new Web3(window.ethereum)
      setWallet({ accounts, balance, chainId })
    } else {
      setNetworkUnsupported(true)
      setErrorMessage("Przełącz sieć na obsługiwaną przez aplikację")
    }
  }, [])

  const updateWallet = useCallback(
    async (accounts: any) => await _updateWallet(accounts),
    [_updateWallet]
  )
  const updateWalletAndAccounts = useCallback(async () => {
    if (client.defaults.headers.common["Authorization"]) {
      await revalidateMe()
    }
    await _updateWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_updateWallet])

  useEffect(() => {
    const chainChanged = () => window.location.reload()

    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true })
      setHasProvider(Boolean(provider))

      if (provider) {
        await updateWalletAndAccounts()
        window.ethereum.on("accountsChanged", updateWallet)
        window.ethereum.on("chainChanged", chainChanged)
      }
    }

    getProvider()

    return () => {
      window.ethereum?.removeListener("accountsChanged", updateWallet)
      window.ethereum?.removeListener("chainChanged", chainChanged)
    }
  }, [updateWallet, updateWalletAndAccounts])

  const connectMetaMask = useCallback(async () => {
    setConnecting(true)

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      clearError()
      await updateWallet(accounts)
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message)
    }
    setConnecting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchNetwork = useCallback(async () => {
    setSwitching(true)

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: formatChainAsHex(supportedChainId),
          },
        ],
      })
      clearError()
      setNetworkUnsupported(false)
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message)
    }
    setSwitching(false)
  }, [])

  const signIn = useCallback(
    async (onUserNotFound: (token: string) => void) => {
      setSigningIn(true)
      const from = wallet.accounts[0]
      try {
        const message = await createSiweMessage(
          Web3.utils.toChecksumAddress(from),
          "Sign in with Ethereum to the app.",
          onUserNotFound
        )

        if (message) {
          try {
            const signature = await window.web3.eth.personal.sign(message, wallet.accounts[0], "")
            const result = await client.SignIn(undefined, { message, signature })

            const { authenticationToken, refreshToken } = result.data
            localStorage.setItem("EventTicketingApp.authenticationToken", authenticationToken)
            localStorage.setItem("EventTicketingApp.refreshToken", refreshToken)
            client.defaults.headers.common["Authorization"] = `Bearer ${authenticationToken}`

            setSignedIn(true)
            await revalidateMe()
          } catch (error: any) {
            console.error(error)
            setErrorMessage(error.message)
          }
        }
      } catch (error: any) {
        console.error(error)
        if (axios.isAxiosError(error)) {
          setErrorMessage((error as AxiosError<{ message?: string }>).response?.data.message)
        }
      }
      setSigningIn(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet]
  )

  const signUp = useCallback(
    async (
      payload: Paths.SignUp.RequestBody,
      onSuccess: () => void,
      onError: (error: any) => void
    ) => {
      try {
        await client.SignUp(undefined, payload)

        onSuccess()
      } catch (error: any) {
        console.error(error)
        onError(error)
      }
    },
    []
  )

  const signOut = useCallback(() => {
    setWallet(disconnectedState)

    localStorage.removeItem("EventTicketingApp.authenticationToken")
    localStorage.removeItem("EventTicketingApp.refreshToken")
    client.defaults.headers.common["Authorization"] = null
    setSignedIn(false)
    setUser(null)
    setFollowedArtists(null)
  }, [])

  client.interceptors.response.use(
    (response) => response,
    async function (error) {
      const originalRequest = error.config
      if (error.response?.status === 401) {
        if (!originalRequest._retry) {
          const refreshToken = localStorage.getItem("EventTicketingApp.refreshToken")
          if (refreshToken) {
            try {
              const result = await client.RefreshTokens(undefined, { refreshToken })

              const data = result.data
              localStorage.setItem(
                "EventTicketingApp.authenticationToken",
                data.authenticationToken
              )
              localStorage.setItem("EventTicketingApp.refreshToken", data.refreshToken)
              client.defaults.headers.common["Authorization"] = `Bearer ${data.authenticationToken}`

              const resultMe = await client.GetMe()
              setUser((currentState) => {
                if (JSON.stringify(currentState) !== JSON.stringify(resultMe.data)) {
                  return resultMe.data
                } else {
                  return currentState
                }
              })
              setSignedIn(true)

              originalRequest.headers["Authorization"] = `Bearer ${data.authenticationToken}`
              originalRequest._retry = true
              return client(originalRequest)
            } catch (error: any) {
              console.error(error)
            }
          }
        }

        signOut()
      }

      return Promise.reject(error)
    }
  )

  return (
    <MetaMaskContext.Provider
      value={{
        wallet,
        hasProvider,
        error: !!errorMessage,
        errorMessage,
        connecting,
        switching,
        networkUnsupported,
        signingIn,
        signedIn,
        user,
        followedArtists,
        clearError,
        connectMetaMask,
        switchNetwork,
        signIn,
        signUp,
        signOut,
        revalidateMe,
        revalidateFollowedArtists,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  )
}

const createSiweMessage = async (
  address: string,
  statement: string,
  onUserNotFound: (signUpToken: string) => void
) => {
  const result = await client.GenerateNonce(
    undefined,
    { publicAddress: address },
    {
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    }
  )

  if (result.status === 404) {
    const { signUpToken } = result.data as unknown as Paths.GenerateNonce.Responses.$404
    onUserNotFound(signUpToken)
    return ""
  } else {
    const { nonce } = result.data
    const siweMessage = new SiweMessage({
      domain,
      address,
      statement,
      uri: origin,
      version: "1",
      chainId: supportedChainId,
      nonce,
    })
    return siweMessage.prepareMessage()
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMetaMask = () => {
  const context = useContext(MetaMaskContext)
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a "MetaMaskContextProvider"')
  }
  return context
}
