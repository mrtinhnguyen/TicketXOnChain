import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import { Link } from "react-router-dom"
import type { Toast } from "primereact/toast"
import { Dialog, DialogProps } from "primereact/dialog"
import { Image } from "primereact/image"
import { ProgressSpinner } from "primereact/progressspinner"
import axios from "axios"
import type { AxiosError } from "axios"
import { formatDatetime } from "~/utils"
import Ticket from "~/utils/ticket"
import { useMetaMask } from "~/hooks/useMetaMask"
import type { Components } from "~/utils/types/openapi.d.ts"
import { Button } from "primereact/button"

interface ITicketProp {
  ticket: any
}

interface IToastProp {
  toast: RefObject<Toast>
}

type Props = ITicketProp & IToastProp & DialogProps

function TicketDetailsDialog({ ticket, toast, visible, ...props }: Readonly<Props>) {
  const { wallet } = useMetaMask()

  const [ticketMetadata, setTicketMetadata] = useState<Components.Schemas.GetToken | null>(null)

  const getTicketMetadata = useCallback(async () => {
    if (window.web3 !== undefined && wallet.accounts.length > 0) {
      const contract = new window.web3.eth.Contract(Ticket, ticket!.ticketAddress)
      contract.handleRevert = true

      const tokenURIMethod = contract.methods.tokenURI(ticket!.tokenId)
      try {
        const ticketURI = await tokenURIMethod.call()
        const result = await axios.get<Components.Schemas.GetToken>(ticketURI)
        setTicketMetadata(result.data)
      } catch (error: any) {
        console.error(error)
        if (axios.isAxiosError(error)) {
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: (error as AxiosError<{ message?: string }>).response?.data.message,
          })
        } else {
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: error.data?.message || error.message,
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, ticket])

  useEffect(() => {
    if (visible) {
      setTicketMetadata(null)
      getTicketMetadata()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <Dialog visible={visible} {...props}>
      <div className="flex flex-column justify-content-center">
        {ticketMetadata ? (
          <>
            {ticketMetadata.image && (
              <div>
                <Image
                  loading="lazy"
                  src={ticketMetadata.image}
                  alt={`${ticketMetadata.name} ilustracja tokenu NFT`}
                  className="w-full"
                  imageClassName="w-full"
                  preview
                />
              </div>
            )}
            <h1>{ticketMetadata.name}</h1>
            <p>ID tokenu: {ticket.tokenId}</p>
            <p className="text-overflow-ellipsis">
              {ticketMetadata.name.split(" ").reduce((acc, value) => acc + value.toUpperCase(), "")}
            </p>
            <Link to={ticketMetadata.external_url}>
              <Button
                label="Przejdź do strony"
                severity="info"
                size="small"
                icon="pi pi-link"
                link
              />
            </Link>
            <div
              dangerouslySetInnerHTML={{ __html: ticketMetadata.description }}
              className="ql-editor m-0 p-0 my-5"
            ></div>
            <p>Atrybuty:</p>
            <ul>
              {ticketMetadata.attributes.map((attribute, idx) => (
                <li key={idx}>
                  {attribute.trait_type}:{" "}
                  {attribute.display_type === "date"
                    ? formatDatetime(new Date(Number(attribute.value)))
                    : attribute.value}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        )}
      </div>
    </Dialog>
  )
}

export default TicketDetailsDialog
