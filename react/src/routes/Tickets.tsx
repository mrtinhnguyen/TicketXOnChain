import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { Tag } from "primereact/tag"
import { ProgressSpinner } from "primereact/progressspinner"
import { useOutletContext } from "react-router-dom"
import client from "~/utils/client"
import { useMetaMask } from "~/hooks/useMetaMask"
import TicketDetailsDialog from "~/components/ticket/TicketDetailsDialog"
import TransferTicketDialog from "~/components/ticket/TransferTicketDialog"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
import type { Paths } from "~/utils/types/openapi.d.ts"
import styles from "~/App.module.css"
import { formatBalance } from "~/utils"

function Tickets() {
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()
  const { wallet } = useMetaMask()

  const [tickets, setTickets] = useState<Paths.ListUserTickets.Responses.$200 | null>(null)

  const [ticket, setTicket] = useState<any>(null)
  const [ticketDetailsVisible, setTicketDetailsVisible] = useState(false)
  const [transferTicketVisible, setTransferTicketVisible] = useState(false)

  const handleListUserTickets = useCallback(async () => {
    setTickets(null)
    const resultUserTickets = await client.ListUserTickets()
    setTickets(resultUserTickets.data)
  }, [])

  useEffect(() => {
    handleListUserTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <h2 className="mt-0">Bilety</h2>
      {tickets ? (
        <div className={`grid w-full ${styles.userTicketsListing}`}>
          {tickets.length > 0 ? (
            <>
              {tickets.map((ticket, idx) => (
                <div
                  key={`${ticket.idTicket !== null ? ticket.idTicket : `ticket-${idx}`}`}
                  className="col-12 md:col-6 lg:col-4"
                >
                  <Card>
                    <h4 className="mt-0">{ticket.eventName}</h4>
                    <div className="mb-2">
                      {ticket.transferable ? (
                        <Tag icon="pi pi-send" className="m-1" rounded>
                          Bilet zbywalny
                        </Tag>
                      ) : (
                        <Tag icon="pi pi-send" severity="warning" className="m-1" rounded>
                          Bilet niezbywalny
                        </Tag>
                      )}
                      {ticket.ticketUsed ? (
                        <Tag icon="pi pi-flag" severity="danger" className="m-1" rounded>
                          Bilet został wykorzystany
                        </Tag>
                      ) : (
                        <Tag icon="pi pi-flag" severity="success" className="m-1" rounded>
                          Bilet nie został wykorzystany
                        </Tag>
                      )}
                    </div>
                    <p>Cena: {formatBalance(ticket.ticketPrice)} ETH</p>
                    <div>
                      <Button
                        label="Pokaż szczegóły"
                        size="small"
                        icon="pi pi-ticket"
                        className="mr-2 mt-2"
                        disabled={wallet.accounts.length === 0}
                        onClick={() => {
                          setTicket(ticket)
                          setTicketDetailsVisible(true)
                        }}
                      />
                      {!!ticket.transferable && (
                        <Button
                          severity="secondary"
                          label="Prześlij bilet"
                          size="small"
                          icon="pi pi-envelope"
                          className="mt-2"
                          disabled={wallet.accounts.length === 0}
                          onClick={() => {
                            setTicket(ticket)
                            setTransferTicketVisible(true)
                          }}
                        />
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </>
          ) : (
            <p className="w-full text-center">Nie znaleziono biletów</p>
          )}
        </div>
      ) : (
        <div className="flex justify-content-center align-items-center">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        </div>
      )}
      <TicketDetailsDialog
        ticket={ticket}
        toast={toast}
        header="Szczegóły biletu"
        visible={ticketDetailsVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setTicketDetailsVisible(false)}
        draggable={false}
      />
      <TransferTicketDialog
        ticket={ticket}
        toast={toast}
        revalidate={handleListUserTickets}
        header="Prześlij bilet"
        visible={transferTicketVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setTransferTicketVisible(false)}
        draggable={false}
      />
    </>
  )
}

export default Tickets
