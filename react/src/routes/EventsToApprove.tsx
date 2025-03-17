import { useState, useEffect, useRef, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { useOutletContext } from "react-router-dom"
import { formatDatetime } from "~/utils"
import client from "~/utils/client"
import { Button } from "primereact/button"
import EventDetailsDialog from "~/components/event/EventDetailsDialog"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import type { Paths } from "~/utils/types/openapi.d.ts"
import ConfirmDialog from "~/components/ConfirmDialog"

function EventsToApprove() {
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const [eventDetailsVisible, setEventDetailsVisible] = useState(false)

  const [deleteEventVisible, setDeleteEventVisible] = useState<boolean>(false)

  const handleDeleteEventSubmit = useRef<() => Promise<void>>(async () => {})

  const [eventsToApprove, setEventsToApprove] =
    useState<Paths.ListEventsToApprove.Responses.$200 | null>(null)
  const [selectedEventToApprove, setSelectedEventToApprove] = useState<any>(null)

  const eventDetailsButtonTemplate = useCallback(
    (event: any) => (
      <>
        <Button
          label="Pokaż szczegóły"
          severity="danger"
          size="small"
          icon="pi pi-external-link"
          onClick={() => {
            setSelectedEventToApprove(event)
            setEventDetailsVisible(true)
          }}
          className="mr-2"
        />
      </>
    ),
    []
  )

  const [filters, setFilters] = useState<object>({})

  const [loading, setLoading] = useState<boolean>(false)

  const [rowsPerPage] = useState(3)
  const [page, setPage] = useState(1)

  const handleListEventsToApprove = useCallback(async () => {
    setLoading(true)
    setEventsToApprove(null)
    const result = await client.ListEventsToApprove({
      page,
    })
    setEventsToApprove(result.data)
    setLoading(false)
  }, [page])

  useEffect(() => {
    if (eventsToApprove) {
      setPage(eventsToApprove.currentPage)
    }
  }, [eventsToApprove])

  useEffect(() => {
    handleListEventsToApprove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const onPage = useCallback((event: any) => {
    setPage(event.first / 3 + 1)
    setFilters({})
  }, [])

  return (
    <>
      <h2 className="mt-0">Wydarzenia do zatwierdzenia</h2>
      <DataTable
        value={eventsToApprove?.results}
        paginator
        rows={rowsPerPage}
        first={(page - 1) * rowsPerPage}
        totalRecords={eventsToApprove?.count}
        onPage={onPage}
        tableStyle={{ minWidth: "50rem" }}
        loading={loading}
        lazy
        emptyMessage="Nie znaleziono wydarzeń"
      >
        <Column field="name" header="Nazwa"></Column>
        <Column field="creatorUsername" header="Twórca"></Column>
        <Column
          body={(event) => formatDatetime(new Date(event.created))}
          header="Utworzono"
        ></Column>
        <Column header="Opcje" body={eventDetailsButtonTemplate}></Column>
      </DataTable>
      <EventDetailsDialog
        revalidate={handleListEventsToApprove}
        toast={toast}
        event={selectedEventToApprove}
        header="Szczegóły wydarzenia"
        visible={eventDetailsVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setEventDetailsVisible(false)}
        handleDeleteEventSubmit={handleDeleteEventSubmit}
        setDeleteEventVisible={setDeleteEventVisible}
        draggable={false}
      />

      <ConfirmDialog
        header="Usuń wydarzenie"
        visible={deleteEventVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setDeleteEventVisible(false)}
        draggable={false}
        text="Czy chcesz usunąć to wydarzenie?"
        handleSubmit={handleDeleteEventSubmit.current}
      />
    </>
  )
}

export default EventsToApprove
