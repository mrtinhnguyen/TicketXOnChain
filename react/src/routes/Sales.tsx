import { useState, useEffect, useCallback } from "react"
import { formatDatetime, formatBalance } from "~/utils"
import client from "~/utils/client"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import type { Paths } from "~/utils/types/openapi.d.ts"

function Sales() {
  const [eventsTickets, setEventsTickets] = useState<
    Paths.ListUserEventsTickets.Responses.$200 | undefined
  >(undefined)

  const [loading, setLoading] = useState<boolean>(false)

  const handleListEventsTickets = useCallback(async () => {
    setLoading(true)
    setEventsTickets(undefined)
    const result = await client.ListUserEventsTickets()
    setEventsTickets(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    handleListEventsTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <h2 className="mt-0">Sprzedaż</h2>
      <p>Ostatnie 100 sprzedaży</p>
      <DataTable
        value={eventsTickets}
        paginator
        rows={20}
        tableStyle={{ minWidth: "50rem" }}
        loading={loading}
        emptyMessage="Nie znaleziono sprzedaży"
      >
        <Column field="eventName" header="Wydarzenie"></Column>
        <Column field="email" header="Adres email"></Column>
        <Column field="username" header="Kupujący"></Column>
        <Column header="Cena" body={(ticket) => formatBalance(ticket.ticketPrice)} />
        <Column field="tokenId" header="ID tokenu"></Column>
        <Column
          body={(ticket) => formatDatetime(new Date(ticket.created))}
          header="Kupiono"
        ></Column>
      </DataTable>
    </>
  )
}

export default Sales
