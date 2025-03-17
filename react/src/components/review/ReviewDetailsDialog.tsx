import { useState, useCallback } from "react"
import type { RefObject, MutableRefObject } from "react"
import { Link } from "react-router-dom"
import type { Toast } from "primereact/toast"
import { Button } from "primereact/button"
import { Dialog, DialogProps } from "primereact/dialog"
import axios from "axios"
import type { AxiosError } from "axios"
import { formatDatetime, generateIdString } from "~/utils"
import client from "~/utils/client"
import { Rating } from "primereact/rating"

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface IToastProp {
  toast: RefObject<Toast>
}

interface IReviewProp {
  review: any
}

interface IDeleteReviewProp {
  handleDeleteReviewSubmit: MutableRefObject<() => Promise<void>>
  setDeleteReviewVisible: (visible: boolean) => void
}

type Props = IRevalidateProp & IToastProp & IReviewProp & DialogProps & IDeleteReviewProp

function ReviewDetailsDialog({
  revalidate,
  toast,
  review,
  visible,
  onHide,
  handleDeleteReviewSubmit,
  setDeleteReviewVisible,
  ...props
}: Readonly<Props>) {
  const [managingReview, setManagingReview] = useState(false)

  const handleApproveReview = useCallback(async () => {
    try {
      setManagingReview(true)

      await client.ApproveReview({
        id: review!.idReview,
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
      setManagingReview(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review])

  const handleShowDeleteReview = () => {
    handleDeleteReviewSubmit.current = async () => {
      await handleDeleteReview()
    }
    setDeleteReviewVisible(true)
  }

  const handleDeleteReview = useCallback(async () => {
    try {
      setManagingReview(true)

      await client.DeleteReview({
        id: review!.idReview,
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
      setManagingReview(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review])

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      {review && (
        <div className="card">
          <div className="mb-5">
            <p>Recenzent</p>
            <p>{review.reviewerUsername}</p>
          </div>
          <div className="mb-5">
            <p>Zrecenzowano</p>
            <p>
              <Link
                to={`/artists/${generateIdString(review.reviewedName, review.reviewedIdArtist)}`}
                target="_blank"
              >
                {review?.reviewedName}
              </Link>
            </p>
          </div>
          <div className="mb-5">
            <p>Tytuł</p>
            <p>{review.title}</p>
          </div>
          <div className="mb-5">
            <p>Treść</p>
            <p>{review.content}</p>
          </div>
          <div className="mb-5">
            <p>Lokalizacja</p>
            <p>{review.eventLocation}</p>
          </div>
          <div className="mb-5">
            <p>Data</p>
            <p>{review.eventDate}</p>
          </div>
          <div className="mb-5">
            <p>Ocena</p>
            <Rating value={review.rate} readOnly cancel={false} />
          </div>
          <div className="mb-5">
            <p>Utworzono</p>
            <p>{formatDatetime(new Date(review.created))}</p>
          </div>

          <div>
            <Button
              label="Zatwierdź"
              severity="success"
              icon="pi pi-check"
              loading={managingReview}
              className="mt-2 mr-3"
              onClick={handleApproveReview}
            />
            <Button
              label="Usuń"
              severity="danger"
              icon="pi pi-times"
              loading={managingReview}
              className="mt-2"
              onClick={handleShowDeleteReview}
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}

export default ReviewDetailsDialog
