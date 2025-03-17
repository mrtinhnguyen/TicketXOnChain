import { useState, useEffect, useRef, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { useOutletContext } from "react-router-dom"
import { formatDatetime } from "~/utils"
import client from "~/utils/client"
import { Button } from "primereact/button"
import ReviewDetailsDialog from "~/components/review/ReviewDetailsDialog"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import type { Paths } from "~/utils/types/openapi.d.ts"
import ConfirmDialog from "~/components/ConfirmDialog"

function ReviewsToApprove() {
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const [reviewDetailsVisible, setReviewDetailsVisible] = useState(false)

  const [deleteReviewVisible, setDeleteReviewVisible] = useState<boolean>(false)

  const handleDeleteReviewSubmit = useRef<() => Promise<void>>(async () => {})

  const [reviewsToApprove, setReviewsToApprove] =
    useState<Paths.ListReviewsToApprove.Responses.$200 | null>(null)
  const [selectedReviewToApprove, setSelectedReviewToApprove] = useState<any>(null)

  const reviewDetailsButtonTemplate = useCallback(
    (review: any) => (
      <>
        <Button
          label="Pokaż szczegóły"
          severity="danger"
          size="small"
          icon="pi pi-external-link"
          onClick={() => {
            setSelectedReviewToApprove(review)
            setReviewDetailsVisible(true)
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

  const handleListReviewsToApprove = useCallback(async () => {
    setLoading(true)
    setReviewsToApprove(null)
    const result = await client.ListReviewsToApprove({
      page,
    })
    setReviewsToApprove(result.data)
    setLoading(false)
  }, [page])

  useEffect(() => {
    if (reviewsToApprove) {
      setPage(reviewsToApprove.currentPage)
    }
  }, [reviewsToApprove])

  useEffect(() => {
    handleListReviewsToApprove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const onPage = useCallback((event: any) => {
    setPage(event.first / 3 + 1)
    setFilters({})
  }, [])

  return (
    <>
      <h2 className="mt-0">Recenzje do zatwierdzenia</h2>
      <DataTable
        value={reviewsToApprove?.results}
        paginator
        rows={rowsPerPage}
        first={(page - 1) * rowsPerPage}
        totalRecords={reviewsToApprove?.count}
        onPage={onPage}
        tableStyle={{ minWidth: "50rem" }}
        loading={loading}
        lazy
        emptyMessage="Nie znaleziono recenzji"
      >
        <Column field="title" header="Tytuł"></Column>
        <Column field="reviewerUsername" header="Recenzent"></Column>
        <Column
          body={(review) => formatDatetime(new Date(review.created))}
          header="Utworzono"
        ></Column>
        <Column header="Opcje" body={reviewDetailsButtonTemplate}></Column>
      </DataTable>
      <ReviewDetailsDialog
        revalidate={handleListReviewsToApprove}
        toast={toast}
        review={selectedReviewToApprove}
        header="Szczegóły recenzji"
        visible={reviewDetailsVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setReviewDetailsVisible(false)}
        handleDeleteReviewSubmit={handleDeleteReviewSubmit}
        setDeleteReviewVisible={setDeleteReviewVisible}
        draggable={false}
      />
      <ConfirmDialog
        header="Usuń recenzję"
        visible={deleteReviewVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setDeleteReviewVisible(false)}
        draggable={false}
        text="Czy chcesz usunąć tę recenzję?"
        handleSubmit={handleDeleteReviewSubmit.current}
      />
    </>
  )
}

export default ReviewsToApprove
