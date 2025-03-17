import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom"
import { useState, useEffect, useRef, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import type { Paths } from "~/utils/types/openapi.d.ts"
import client from "~/utils/client"
import axios from "axios"
import type { AxiosError } from "axios"
import { ProgressSpinner } from "primereact/progressspinner"
import { Image } from "primereact/image"
import { Carousel } from "primereact/carousel"
import { Card } from "primereact/card"
import { generateIdString, formatBalance, formatDatetime } from "~/utils"
import { Button } from "primereact/button"
import { Tag } from "primereact/tag"
import { Rating } from "primereact/rating"
import { useMetaMask } from "~/hooks/useMetaMask"
import ConfirmDialog from "~/components/ConfirmDialog"
import styles from "~/App.module.css"
import PageTitle from "~/components/PageTitle"
import EditArtistDialog from "~/components/artist/EditArtistDialog"
import CreateReviewDialog from "~/components/review/CreateReviewDialog"
import placeholderImage from "~/assets/event-placeholder.jpg"

const responsiveOptions = [
  {
    breakpoint: "1400px",
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: "575px",
    numVisible: 1,
    numScroll: 1,
  },
]

function eventTemplate(event: any) {
  return (
    <div className="border-1 surface-border border-round bg-white m-2 text-center py-5 px-3">
      <Link to={`/events/${generateIdString(event.name, event.idEvent)}`}>
        <Image
          loading="lazy"
          src={event.image ?? placeholderImage}
          alt={event.name}
          className={styles.previewImageContainer}
          imageClassName={styles.image}
        />
      </Link>
      <h4>{event.name}</h4>
      <div className="mb-2">
        {event.transferable ? (
          <Tag icon="pi pi-send" className="m-1" rounded>
            Bilet zbywalny
          </Tag>
        ) : (
          <Tag icon="pi pi-send" severity="warning" className="m-1" rounded>
            Bilet niezbywalny
          </Tag>
        )}
        <Tag icon="pi pi-bookmark" severity="warning" className="m-1" rounded>
          {event.subcategoryName}
        </Tag>
        <Tag icon="pi pi-thumbs-up" severity="danger" className="m-1" rounded>
          {event.likes} polubienia
        </Tag>
      </div>
      <p>Miasto: {event.cityName}</p>
      <p>Cena: {formatBalance(event.ticketPrice)} ETH</p>
      <p>Dostępne bilety: {event.remainingTicketCount}</p>
      <p>Rozpoczyna się: {formatDatetime(new Date(event.start))}</p>
      <div>
        <Link to={`/events/${generateIdString(event.name, event.idEvent)}`}>
          <Button label="Przejdź do strony" severity="info" size="small" icon="pi pi-link" link />
        </Link>
      </div>
    </div>
  )
}

function Artist() {
  const { signedIn, user, followedArtists, revalidateFollowedArtists } = useMetaMask()

  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const [artist, setArtist] = useState<Paths.GetArtist.Responses.$200 | null>(null)

  const handleGetArtist = useCallback(async (idArtist: number) => {
    try {
      setArtist(null)
      const result = await client.GetArtist({ id: idArtist })
      setArtist(result.data)
    } catch (error: any) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: (error as AxiosError<{ message?: string }>).response?.data.message,
        })
        navigate("/", { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const splittedId = id?.split("-")
    const idArtist = splittedId ? Number(splittedId[splittedId.length - 1]) : undefined

    if (idArtist && !isNaN(idArtist)) {
      handleGetArtist(idArtist)
    } else {
      navigate("/", { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, signedIn])

  useEffect(() => {
    if (artist) {
      window.history.replaceState(
        null,
        "",
        `/artists/${generateIdString(artist.name, artist.idArtist)}`
      )
    }
  }, [artist])

  const [deleteReviewVisible, setDeleteReviewVisible] = useState<boolean>(false)

  const handleShowDeleteReview = (idReview: number) => {
    handleDeleteReviewSubmit.current = async () => {
      await handleDeleteReview(idReview)
    }
    setDeleteReviewVisible(true)
  }

  const handleDeleteReviewSubmit = useRef<() => Promise<void>>(async () => {})

  const handleDeleteReview = useCallback(
    async (idReview: number) => {
      try {
        await client.DeleteReview({ id: idReview })
        toast.current?.show({
          severity: "success",
          summary: "Komunikat o powodzeniu",
          detail: "Pomyślnie usunięto recenzję",
        })
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
        const result = await client.GetArtist({ id: artist!.idArtist })
        setArtist(result.data)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artist]
  )

  const [followingArtist, setFollowingArtist] = useState<boolean>(false)

  const handleFollowArtist = useCallback(async () => {
    try {
      setFollowingArtist(true)
      await client.FollowArtist({ id: artist!.idArtist })
      toast.current?.show({
        severity: "success",
        summary: "Komunikat o powodzeniu",
        detail: "Pomyślnie zaobserwowano artystę",
      })
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
      await revalidateFollowedArtists()
      setFollowingArtist(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist])

  const handleUnfollowArtist = useCallback(async () => {
    try {
      setFollowingArtist(true)
      await client.UnfollowArtist({ id: artist!.idArtist })
      toast.current?.show({
        severity: "success",
        summary: "Komunikat o powodzeniu",
        detail: "Pomyślnie odobserwowano artystę",
      })
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
      await revalidateFollowedArtists()
      setFollowingArtist(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist])

  const [editArtistVisible, setEditArtistVisible] = useState(false)
  const [createReviewVisible, setCreateReviewVisible] = useState(false)

  return (
    <>
      {artist ? (
        <>
          <PageTitle title={artist.name} />
          <div className="grid">
            <div className="col-12 md:col-6">
              <Image
                loading="lazy"
                src={artist.pictureUrl}
                alt={artist.name}
                className={styles.imageContainer}
                imageClassName={styles.image}
                preview
              />
            </div>
          </div>
          <h1>{artist.name}</h1>
          {user?.role === "ADMINISTRATOR" && (
            <Button
              label="Edytuj artystę"
              severity="danger"
              icon="pi pi-external-link"
              onClick={() => {
                setEditArtistVisible(true)
              }}
              className="mr-2 mt-2"
            />
          )}
          {signedIn && followedArtists && (
            <>
              {followedArtists.find(
                (followedArtist) => followedArtist.idArtist === artist.idArtist
              ) ? (
                <Button
                  label="Odobserwuj artystę"
                  onClick={handleUnfollowArtist}
                  icon="pi pi-eye-slash"
                  severity="danger"
                  className="mt-2"
                  loading={followingArtist}
                />
              ) : (
                <Button
                  label="Zaobserwuj artystę"
                  onClick={handleFollowArtist}
                  icon="pi pi-eye"
                  severity="success"
                  className="mt-2"
                  loading={followingArtist}
                />
              )}
            </>
          )}
          <div
            dangerouslySetInnerHTML={{ __html: artist.description }}
            className="ql-editor m-0 p-0 my-5"
          ></div>
          <hr className="my-5" />
          <h3 className="text-center">Wydarzenia</h3>
          <div className="card">
            {artist.events.length > 0 ? (
              <Carousel
                value={artist.events}
                numVisible={3}
                numScroll={1}
                responsiveOptions={responsiveOptions}
                itemTemplate={eventTemplate}
              />
            ) : (
              <p className="text-center">Nie znaleziono wydarzeń</p>
            )}
          </div>
          <hr className="my-5" />
          <h3 className="text-center">Recenzje</h3>
          {signedIn && (
            <Button
              label="Utwórz recenzję"
              severity="success"
              icon="pi pi-external-link"
              onClick={() => {
                setCreateReviewVisible(true)
              }}
              className="mb-3"
            />
          )}
          {artist.reviews.length > 0 ? (
            <div
              style={{
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {artist.reviews.map((review) => (
                <Card key={review.idReview} title={review.title} className="mb-3 relative">
                  {user && user.role === "ADMINISTRATOR" && (
                    <Button
                      icon="pi pi-times"
                      rounded
                      severity="danger"
                      aria-label="Usuń"
                      className="absolute z-1"
                      size="small"
                      style={{
                        bottom: "0",
                        right: "0",
                        height: "2.2rem",
                        width: "2rem",
                        margin: "1.25rem",
                      }}
                      onClick={() => handleShowDeleteReview(review.idReview)}
                    />
                  )}
                  <p className="m-0">{review.content}</p>
                  <div className="my-2">
                    <span className="text-sm mr-2">Lokalizacja: {review.eventLocation}</span>
                    <span className="text-sm mr-2">Data: {review.eventDate}</span>
                    <span className="text-sm mr-2">Recenzent: {review.reviewerUsername}</span>
                    <span className="text-sm">
                      Utworzono: {formatDatetime(new Date(review.created))}
                    </span>
                  </div>
                  <Rating value={review.rate} readOnly cancel={false} />
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center">Nie znaleziono recenzji</p>
          )}
          <ConfirmDialog
            header="Usuń recenzję"
            visible={deleteReviewVisible}
            style={{ width: "100%", maxWidth: "500px" }}
            className="m-3"
            onHide={() => setDeleteReviewVisible(false)}
            draggable={false}
            text="Czy chcesz usunąć recenzję?"
            handleSubmit={handleDeleteReviewSubmit.current}
          />
          <EditArtistDialog
            revalidate={async () => await handleGetArtist(artist.idArtist)}
            toast={toast}
            idArtist={artist.idArtist}
            header="Edytuj artystę"
            visible={editArtistVisible}
            style={{ width: "100%", maxWidth: "800px" }}
            className="m-3"
            onHide={() => setEditArtistVisible(false)}
            draggable={false}
          />
          <CreateReviewDialog
            toast={toast}
            idArtist={artist.idArtist}
            header="Utwórz recenzję"
            visible={createReviewVisible}
            style={{ width: "100%", maxWidth: "800px" }}
            className="m-3"
            onHide={() => setCreateReviewVisible(false)}
            draggable={false}
          />
        </>
      ) : (
        <div className="flex justify-content-center align-items-center">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        </div>
      )}
    </>
  )
}

export default Artist
