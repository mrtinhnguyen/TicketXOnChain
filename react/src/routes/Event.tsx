import { useParams, useNavigate, useOutletContext, Link } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import type { Paths } from "~/utils/types/openapi.d.ts"
import client from "~/utils/client"
import axios from "axios"
import type { AxiosError } from "axios"
import { ProgressSpinner } from "primereact/progressspinner"
import { Image } from "primereact/image"
import { Carousel } from "primereact/carousel"
import { generateIdString, formatBalance, formatDatetime, generateCountdownString } from "~/utils"
import { Button } from "primereact/button"
import { Tag } from "primereact/tag"
import { useMetaMask } from "~/hooks/useMetaMask"
import { Galleria } from "primereact/galleria"
import Ticket from "~/utils/ticket"
import Web3 from "web3"
import { InputNumber } from "primereact/inputnumber"
import { gapi, google, CLIENT_ID, API_KEY, DISCOVERY_DOCS, SCOPES } from "~/calendar"
import ConfirmDialog from "~/components/ConfirmDialog"
import VerifyTicketDialog from "~/components/ticket/VerifyTicketDialog"
import PreviewFundsDialog from "~/components/event/PreviewFundsDialog"
import EditEventDialog from "~/components/event/EditEventDialog"
import styles from "~/App.module.css"
import PageTitle from "~/components/PageTitle"
import ReactPlayer from "react-player/lazy"

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

function artistTemplate(artist: any) {
  return (
    <div className="border-1 surface-border border-round bg-white m-2 text-center py-5 px-3">
      <Link to={`/artists/${generateIdString(artist.name, artist.idArtist)}`}>
        <Image
          loading="lazy"
          src={artist.pictureUrl}
          alt={artist.name}
          className={styles.previewImageContainer}
          imageClassName={styles.image}
        />
      </Link>
      <h4 className="mb-1">{artist.name}</h4>
      <div className="mt-5 flex flex-wrap gap-2 justify-content-center">
        <Link to={`/artists/${generateIdString(artist.name, artist.idArtist)}`}>
          <Button label="Przejdź do strony" severity="info" size="small" icon="pi pi-link" link />
        </Link>
      </div>
    </div>
  )
}

function Event() {
  const { wallet, signedIn, user } = useMetaMask()

  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const [event, setEvent] = useState<Paths.GetEvent.Responses.$200 | null>(null)

  const handleGetEvent = useCallback(async (idEvent: number) => {
    try {
      setEvent(null)
      const result = await client.GetEvent({ id: idEvent })
      setEvent(result.data)
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
    const idEvent = splittedId ? Number(splittedId[splittedId.length - 1]) : undefined

    if (idEvent && !isNaN(idEvent)) {
      handleGetEvent(idEvent)
    } else {
      navigate("/", { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, signedIn])

  const [countdown, setCountdown] = useState<string>("")

  useEffect(() => {
    let countdownInterval: any = null

    if (event) {
      window.history.replaceState(
        null,
        "",
        `/events/${generateIdString(event.name, event.idEvent)}`
      )

      const timeDiff = new Date(event.start).getTime() - new Date().getTime()
      if (timeDiff >= 0) {
        setCountdown(generateCountdownString(timeDiff))
        countdownInterval = setInterval(() => {
          const timeDiff = new Date(event.start).getTime() - new Date().getTime()
          setCountdown(generateCountdownString(timeDiff))
        }, 1000)
      }
    }

    return () => {
      if (countdownInterval) {
        clearTimeout(countdownInterval)
      }
    }
  }, [event])

  const [deleteEventVisible, setDeleteEventVisible] = useState<boolean>(false)

  const handleShowDeleteEvent = () => {
    setDeleteEventVisible(true)
  }

  const handleDeleteEvent = useCallback(async () => {
    try {
      await client.DeleteEvent({ id: event!.idEvent })
      toast.current?.show({
        severity: "success",
        summary: "Komunikat o powodzeniu",
        detail: "Pomyślnie usunięto wydarzenie",
      })
      navigate("/", { replace: true })
    } catch (error: any) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: (error as AxiosError<{ message?: string }>).response?.data.message,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  const [eventLiked, setEventLiked] = useState<boolean>(false)

  const handleLikeEvent = useCallback(async () => {
    try {
      setEventLiked(true)
      await client.LikeEvent({ id: event!.idEvent })
      toast.current?.show({
        severity: "success",
        summary: "Komunikat o powodzeniu",
        detail: "Pomyślnie polubiono wydarzenie",
      })
    } catch (error: any) {
      console.error(error)
      setEventLiked(false)
      if (axios.isAxiosError(error)) {
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: (error as AxiosError<{ message?: string }>).response?.data.message,
        })
      }
    } finally {
      const result = await client.GetEvent({ id: event!.idEvent })
      setEvent(result.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  const [gettingTicket, setGettingTicket] = useState<boolean>(false)

  const [ticketCount, setTicketCount] = useState<number>(1)

  useEffect(() => {
    setTicketCount(1)
  }, [event])

  const handleGetTicket = useCallback(async () => {
    if (window.web3 !== undefined && wallet.accounts.length > 0) {
      const contract = new (window.web3 as Web3).eth.Contract(Ticket, event!.contractAddress!)
      contract.handleRevert = true

      const ticketPrice = event!.ticketPrice as unknown as number
      const multiSafeMintMethod = contract.methods.multiSafeMint(wallet.accounts[0], ticketCount)
      try {
        setGettingTicket(true)
        await multiSafeMintMethod.call({
          from: wallet.accounts[0],
          value: (ticketPrice * ticketCount).toString(),
        })
        await multiSafeMintMethod.send({
          from: wallet.accounts[0],
          value: (ticketPrice * ticketCount).toString(),
        })
      } catch (error: any) {
        console.error(error)
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: error.data?.message || error.message,
        })
      } finally {
        const result = await client.GetEvent({ id: event!.idEvent })
        setEvent(result.data)
        setGettingTicket(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, event, ticketCount])

  const [accessToken, setAccessToken] = useState<string>(
    localStorage.getItem("EventTicketingApp.gapiAccessToken") ?? ""
  )
  const [expiresIn, setExpiresIn] = useState<string>(
    localStorage.getItem("EventTicketingApp.gapiExpiresIn") ?? ""
  )
  const [gapiInited, setGapiInited] = useState<boolean>(false)
  const [gisInited, setGisInited] = useState<boolean>(false)
  const [tokenClient, setTokenClient] = useState<any>(null)

  const [creatingGoogleCalendarEvent, setCreatingGoogleCalendarEvent] = useState<boolean>(false)
  const [googleCalendarEventAdded, setGoogleCalendarEventAdded] = useState<boolean>(false)

  useEffect(() => {
    const initializeGapiClient = async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOCS],
      })

      setGapiInited(true)

      if (accessToken && expiresIn) {
        gapi.client.setToken({
          access_token: accessToken,
          expires_in: expiresIn,
        })
      }
    }

    if (CLIENT_ID && API_KEY && gapi && google) {
      gapi.load("client", initializeGapiClient)

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "",
      })

      setTokenClient(tokenClient)

      setGisInited(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddGoogleCalendarEvent = useCallback(() => {
    setCreatingGoogleCalendarEvent(true)

    const calendarEvent = {
      kind: "calendar#event",
      summary: event!.name,
      location: `${event!.location}, ${event!.street}, ${event!.postalCode} ${event!.cityName}`,
      description: event!.subcategoryName,
      start: {
        dateTime: event!.start,
        timeZone: "UTC",
      },
      end: {
        dateTime: event!.start,
        timeZone: "UTC",
      },
      organizer: {
        displayName: event!.creatorUsername,
      },
      source: {
        title: "Aplikacja do sprzedaży biletów",
        url: window.location.href,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        throw resp
      }

      const { access_token, expires_in } = gapi.client.getToken()

      localStorage.setItem("EventTicketingApp.gapiAccessToken", access_token)
      localStorage.setItem("EventTicketingApp.gapiExpiresIn", expires_in.toString())

      setAccessToken(access_token)
      setExpiresIn(expires_in.toString())

      const request = gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: calendarEvent,
        sendUpdates: "none",
      })

      try {
        request.execute(
          (event: any) => {
            if (event.code && event.code >= 300) {
              console.error(event)
              setCreatingGoogleCalendarEvent(false)
              toast.current?.show({
                severity: "error",
                summary: "Komunikat o błędzie",
                detail: "Nie udało się dodać wydarzenia do kalendarza",
              })
              return
            }

            setCreatingGoogleCalendarEvent(false)
            toast.current?.show({
              severity: "success",
              summary: "Komunikat o powodzeniu",
              detail: "Pomyślnie dodano wydarzenie do kalendarza",
            })
            setGoogleCalendarEventAdded(true)

            if (event.htmlLink) {
              window.open(event.htmlLink)
            }
          },
          (error: any) => {
            console.error(error)
            setCreatingGoogleCalendarEvent(false)
            toast.current?.show({
              severity: "error",
              summary: "Komunikat o błędzie",
              detail: "Nie udało się dodać wydarzenia do kalendarza",
            })
          }
        )
      } catch (error: any) {
        console.error(error)
        setCreatingGoogleCalendarEvent(false)
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: "Nie udało się dodać wydarzenia do kalendarza",
        })
      }
    }

    if (!(accessToken && expiresIn)) {
      tokenClient.requestAccessToken({ prompt: "consent" })
    } else {
      tokenClient.requestAccessToken({ prompt: "" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  const [verifyTicketVisible, setVerifyTicketVisible] = useState(false)
  const [previewFundsVisible, setPreviewFundsVisible] = useState(false)
  const [editEventVisible, setEditEventVisible] = useState(false)

  const imageTemplate = useCallback(
    (image: any) => {
      return (
        <Image
          loading="lazy"
          src={image.url}
          alt={event!.name}
          className={styles.imageContainer}
          imageClassName={styles.image}
          preview
        />
      )
    },
    [event]
  )

  const thumbnailTemplate = useCallback(
    (image: any) => {
      return <Image loading="lazy" src={image.url} alt={event!.name} />
    },
    [event]
  )

  return (
    <>
      {event ? (
        <>
          <PageTitle title={event.name} />
          <div className="flex justify-content-end">
            {user && user.role === "ADMINISTRATOR" && (
              <Button
                icon="pi pi-times"
                rounded
                severity="danger"
                aria-label="Usuń"
                size="small"
                style={{
                  height: "2.2rem",
                  width: "2rem",
                  margin: "1.25rem",
                }}
                onClick={handleShowDeleteEvent}
              />
            )}
          </div>
          <div className="card">
            <div className="grid">
              <div className="col-12 md:col-6">
                {event.images.length > 0 && (
                  <Galleria
                    value={event.images}
                    numVisible={5}
                    circular
                    showThumbnails={false}
                    showItemNavigators
                    item={imageTemplate}
                    thumbnail={thumbnailTemplate}
                    showIndicators
                    showIndicatorsOnItem={false}
                    indicatorsPosition="bottom"
                    className="p-galleria-custom"
                  />
                )}
              </div>
            </div>
          </div>
          <h1>{event.name}</h1>
          <div className="mb-3">
            {user?.role === "EVENTS_ORGANIZER" && user?.idUser === event.creatorIdUser && (
              <>
                {event.contractAddress && (
                  <Button
                    label="Weryfikuj bilet"
                    size="small"
                    icon="pi pi-search"
                    className="mt-2 mr-2"
                    onClick={() => setVerifyTicketVisible(true)}
                  />
                )}
                <Button
                  label="Edytuj wydarzenie"
                  size="small"
                  severity="danger"
                  icon="pi pi-external-link"
                  className="mt-2 mr-2"
                  disabled={wallet.accounts.length === 0}
                  onClick={() => {
                    setEditEventVisible(true)
                  }}
                />
                {event.contractAddress && (
                  <Button
                    label="Zobacz środki"
                    severity="warning"
                    size="small"
                    icon="pi pi-money-bill"
                    className="mt-2"
                    disabled={wallet.accounts.length === 0}
                    onClick={() => {
                      setPreviewFundsVisible(true)
                    }}
                  />
                )}
              </>
            )}
          </div>
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
          <h5>{countdown} do rozpoczęcia</h5>
          {event.contractAddress && (
            <>
              <div className="mb-3">
                <Button
                  label="Dodaj do kalendarza Google"
                  onClick={handleAddGoogleCalendarEvent}
                  icon="pi pi-calendar"
                  severity="warning"
                  rounded
                  className="mr-2 mt-2"
                  disabled={!(gapiInited && gisInited) || googleCalendarEventAdded}
                  loading={creatingGoogleCalendarEvent}
                  size="small"
                />
                <Button
                  label={`Polub: ${event.likes}`}
                  onClick={handleLikeEvent}
                  icon="pi pi-thumbs-up"
                  severity="danger"
                  rounded
                  className="mt-2"
                  disabled={eventLiked}
                  size="small"
                />
              </div>
              <div>
                {event.remainingTicketsPerUser > 0 ? (
                  <>
                    <InputNumber
                      value={ticketCount}
                      onValueChange={(event) => setTicketCount(Number(event.value))}
                      useGrouping={false}
                      min={1}
                      max={event.remainingTicketsPerUser}
                      className="mr-2 mt-2"
                    />
                    <Button
                      label={
                        wallet.accounts.length > 0 && signedIn
                          ? "Mintuj bilet"
                          : "Zaloguj się, aby zmintować bilet"
                      }
                      severity="help"
                      icon="pi pi-shopping-cart"
                      className="mr-2 mt-2"
                      disabled={wallet.accounts.length === 0 || !signedIn}
                      loading={gettingTicket}
                      onClick={handleGetTicket}
                    />
                  </>
                ) : (
                  <Button
                    label="Posiadasz już bilet"
                    className="mr-2 mt-2"
                    severity="warning"
                    disabled
                  />
                )}
              </div>
            </>
          )}
          <div
            dangerouslySetInnerHTML={{ __html: event.description }}
            className="ql-editor m-0 p-0 my-5"
          ></div>
          {event.video && (
            <div className="grid">
              <div className="col-12 md:col-6">
                <ReactPlayer className="w-full" url={event.video} controls light />
              </div>
            </div>
          )}
          <p>
            Adres: {event.location}, {event.street}, {event.postalCode} {event.cityName}
          </p>
          <p>Cena: {formatBalance(event.ticketPrice)} ETH</p>
          <p>Dostępne bilety: {event.remainingTicketCount}</p>
          <p>Pozostałe bilety użytkownika: {event.remainingTicketsPerUser}</p>
          <p>Rozpoczyna się: {formatDatetime(new Date(event.start))}</p>
          <p>Twórca: {event.creatorUsername}</p>
          <p>Utworzono: {formatDatetime(new Date(event.created))}</p>
          {event.nftImageUrl && (
            <>
              <hr className="my-5" />
              <div>
                <h3>Unikalna ilustracja tokenu NFT</h3>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <Image
                      loading="lazy"
                      src={event.nftImageUrl}
                      alt={`${event.name} ilustracja tokenu NFT`}
                      className={styles.imageContainer}
                      imageClassName={styles.image}
                      preview
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {event.statuteUrl && (
            <>
              <hr className="my-5" />
              <div>
                <h3>Regulamin</h3>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <a href={event.statuteUrl} rel="noreferrer" target="_blank">
                      Kliknij, aby pobrać
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
          <hr className="my-5" />
          <h3>Mapa</h3>
          <div className="grid">
            <div className="col-12 md:col-6">
              {import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY && (
                <iframe
                  height="450"
                  className="w-full"
                  style={{
                    border: "0",
                  }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?q=${event.location},+${
                    event.street
                  },+${event.postalCode}+${event.cityName}&key=${
                    import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY
                  }`}
                ></iframe>
              )}
            </div>
          </div>
          <hr className="my-5" />
          <h3 className="text-center">Artyści</h3>
          <div className="card">
            {event.artists.length > 0 ? (
              <Carousel
                value={event.artists}
                numVisible={3}
                numScroll={1}
                responsiveOptions={responsiveOptions}
                itemTemplate={artistTemplate}
              />
            ) : (
              <p className="text-center">Nie znaleziono artystów</p>
            )}
          </div>
          <ConfirmDialog
            header="Usuń wydarzenie"
            visible={deleteEventVisible}
            style={{ width: "100%", maxWidth: "500px" }}
            className="m-3"
            onHide={() => setDeleteEventVisible(false)}
            draggable={false}
            text="Czy chcesz usunąć wydarzenie?"
            handleSubmit={handleDeleteEvent}
          />
          <VerifyTicketDialog
            event={event}
            toast={toast}
            header="Weryfikuj bilet"
            visible={verifyTicketVisible}
            style={{ width: "100%", maxWidth: "500px" }}
            className="m-3"
            onHide={() => setVerifyTicketVisible(false)}
            draggable={false}
          />
          <PreviewFundsDialog
            event={event}
            toast={toast}
            header="Zobacz środki"
            visible={previewFundsVisible}
            style={{ width: "100%", maxWidth: "500px" }}
            className="m-3"
            onHide={() => setPreviewFundsVisible(false)}
            draggable={false}
          />
          <EditEventDialog
            revalidate={async () => await handleGetEvent(event.idEvent)}
            toast={toast}
            idEvent={event.idEvent}
            header="Edytuj wydarzenie"
            visible={editEventVisible}
            style={{ width: "100%", maxWidth: "800px" }}
            className="m-3"
            onHide={() => setEditEventVisible(false)}
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

export default Event
