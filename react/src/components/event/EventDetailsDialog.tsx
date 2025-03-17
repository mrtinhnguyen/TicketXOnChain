import { useState, useCallback } from "react"
import type { RefObject, MutableRefObject } from "react"
import type { Toast } from "primereact/toast"
import { Button } from "primereact/button"
import { Dialog, DialogProps } from "primereact/dialog"
import axios from "axios"
import type { AxiosError } from "axios"
import { formatDatetime } from "~/utils"
import client from "~/utils/client"
import { Image } from "primereact/image"
import placeholderImage from "~/assets/event-placeholder.jpg"

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface IToastProp {
  toast: RefObject<Toast>
}

interface IEventProp {
  event: any
}

interface IDeleteEventProp {
  handleDeleteEventSubmit: MutableRefObject<() => Promise<void>>
  setDeleteEventVisible: (visible: boolean) => void
}

type Props = IRevalidateProp & IToastProp & IEventProp & DialogProps & IDeleteEventProp

function EventDetailsDialog({
  revalidate,
  toast,
  event,
  visible,
  onHide,
  handleDeleteEventSubmit,
  setDeleteEventVisible,
  ...props
}: Readonly<Props>) {
  const [managingEvent, setManagingEvent] = useState(false)

  const handleApproveEvent = useCallback(async () => {
    try {
      setManagingEvent(true)

      await client.ApproveEvent({
        id: event!.idEvent,
      })

      onHide()
    } catch (error: any) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: (error as AxiosError<{ message?: string }>).response?.data.message,
        })
      }
    } finally {
      await revalidate()
      setManagingEvent(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  const handleShowDeleteEvent = () => {
    handleDeleteEventSubmit.current = async () => {
      await handleDeleteEvent()
    }
    setDeleteEventVisible(true)
  }

  const handleDeleteEvent = useCallback(async () => {
    try {
      setManagingEvent(true)

      await client.DeleteEvent({
        id: event!.idEvent,
      })

      onHide()
    } catch (error: any) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: (error as AxiosError<{ message?: string }>).response?.data.message,
        })
      }
    } finally {
      await revalidate()
      setManagingEvent(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      {event && (
        <div className="card">
          <div>
            <Image
              loading="lazy"
              src={event.image ?? placeholderImage}
              alt={event.name}
              className="w-full"
              imageClassName="w-full"
              preview
            />
          </div>
          <div className="mb-5">
            <p>Nazwa</p>
            <p>{event.name}</p>
          </div>
          <div className="mb-5">
            <p>Twórca</p>
            <p>{event.creatorUsername}</p>
          </div>
          <div className="mb-5">
            <p>Podkategoria</p>
            <p>{event.subcategoryName}</p>
          </div>
          <div className="mb-5">
            <p>Adres</p>
            <p>
              {event.location}, {event.cityName}
            </p>
          </div>
          <div className="mb-5">
            <p>Rozpoczyna się</p>
            <p>{formatDatetime(new Date(event.start))}</p>
          </div>
          <div className="mb-5">
            <p>Utworzono</p>
            <p>{formatDatetime(new Date(event.created))}</p>
          </div>

          <div>
            {event.deployed ? (
              <Button
                label="Wydarzenie jest zatwierdzane"
                severity="warning"
                loading
                className="mt-2 mr-3"
                disabled
              />
            ) : (
              <Button
                label="Zatwierdź"
                severity="success"
                icon="pi pi-check"
                loading={managingEvent}
                className="mt-2 mr-3"
                onClick={handleApproveEvent}
              />
            )}
            <Button
              label="Usuń"
              severity="danger"
              icon="pi pi-times"
              loading={managingEvent}
              className="mt-2"
              onClick={handleShowDeleteEvent}
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}

export default EventDetailsDialog
