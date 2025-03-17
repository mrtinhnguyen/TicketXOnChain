import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { Button } from "primereact/button"
import { useLocation, useOutletContext, Link } from "react-router-dom"
import { generateIdString, formatBalance, formatDatetime } from "~/utils"
import client from "~/utils/client"
import { useMetaMask } from "~/hooks/useMetaMask"
import CardSkeleton from "~/components/CardSkeleton"
import ApproveTicketDialog from "~/components/ticket/ApproveTicketDialog"
import type { Paths } from "~/utils/types/openapi.d.ts"
import { Dropdown } from "primereact/dropdown"
import type { SelectItemOptionsType } from "primereact/selectitem"
import { InputText } from "primereact/inputtext"
import { Paginator } from "primereact/paginator"
import { ProgressSpinner } from "primereact/progressspinner"
import { Tag } from "primereact/tag"
import { Card } from "primereact/card"
import { Image } from "primereact/image"
import styles from "~/App.module.css"
import placeholderImage from "~/assets/event-placeholder.jpg"

const sortOptions = [
  {
    type: "NEWEST",
    name: "Najnowsze",
  },
  {
    type: "LOWEST_PRICE",
    name: "Najniższa cena",
  },
  {
    type: "HIGHEST_PRICE",
    name: "Najwyższa cena",
  },
  {
    type: "MOST_LIKES",
    name: "Najwięcej polubień",
  },
  {
    type: "STARTING_SOON",
    name: "Rozpoczyna się wkrótce",
  },
]

const paginatorTemplate = {
  layout: "PrevPageLink PageLinks NextPageLink CurrentPageReport",
  CurrentPageReport: (options: any) => {
    return (
      <span
        style={{
          color: "var(--text-color)",
          userSelect: "none",
          width: "120px",
          textAlign: "center",
        }}
      >
        {options.first} - {options.last} z {options.totalRecords}
      </span>
    )
  },
}

function groupedItemTemplate(option: any) {
  return (
    <div className="flex align-items-center">
      <div>{option.optionGroup.name}</div>
    </div>
  )
}

function Index() {
  const location = useLocation()
  const { message } = location.state || {}
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()
  const { wallet } = useMetaMask()

  const [events, setEvents] = useState<Paths.ListEvents.Responses.$200 | null>(null)

  const [approveTicketVisible, setApproveTicketVisible] = useState(false)

  const [search, setSearch] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    { idSubcategory: number; name: string } | undefined
  >()
  const [selectedCity, setSelectedCity] = useState<{ idCity: number; name: string } | undefined>()
  const [selectedSort, setSelectedSort] = useState<
    | {
        type: "NEWEST" | "LOWEST_PRICE" | "HIGHEST_PRICE" | "MOST_LIKES" | "STARTING_SOON"
        name: string
      }
    | undefined
  >()

  const [filters, setFilters] = useState<object>({})

  const [loading, setLoading] = useState<boolean>(false)

  const [rowsPerPage] = useState(3)
  const [page, setPage] = useState(1)

  const handleListEvents = useCallback(async () => {
    setLoading(true)
    setEvents(null)
    const result = await client.ListEvents({
      search: search !== "" ? search : undefined,
      idSubcategory: selectedSubcategory?.idSubcategory,
      idCity: selectedCity?.idCity,
      page,
      sort: selectedSort?.type,
    })
    setEvents(result.data)
    setLoading(false)
  }, [search, selectedSubcategory, selectedCity, page, selectedSort])

  useEffect(() => {
    if (events) {
      setPage(events.currentPage)
    }
  }, [events])

  const filter = () => {
    setPage(1)
    setFilters({})
  }

  const resetFilters = () => {
    setSearch("")
    setSelectedSubcategory(undefined)
    setSelectedCity(undefined)
    setSelectedSort(undefined)
    setPage(1)
    setFilters({})
  }

  useEffect(() => {
    handleListEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (message) {
      toast.current?.show({
        severity: "warn",
        summary: "Komunikat ostrzeżenia",
        detail: message,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  const [categories, setCategories] = useState<SelectItemOptionsType | undefined>(undefined)
  const [cities, setCities] = useState<SelectItemOptionsType | undefined>(undefined)

  const handleListCategories = async () => {
    setCategories(undefined)
    const result = await client.ListCategories()
    setCategories(result.data)
  }
  const handleListCities = async () => {
    setCities(undefined)
    const result = await client.ListCities()
    setCities(result.data)
  }
  useEffect(() => {
    handleListCategories()
    handleListCities()
  }, [])

  const onPageChange = useCallback((event: any) => {
    setPage(event.first / 3 + 1)
    setFilters({})
  }, [])

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-4 lg:col-3 mb-5 md:mb-0">
          <div className="flex flex-column gap-2 mb-3">
            <label htmlFor="search">Szukaj</label>
            <InputText
              id="search"
              type="search"
              placeholder="Szukaj"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-cy="search"
            />
          </div>
          <div className="flex flex-column gap-2 mb-3">
            <label htmlFor="subcategory">Podkategoria</label>
            <Dropdown
              id="subcategory"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.value)}
              options={categories}
              optionLabel="name"
              optionGroupLabel="name"
              optionGroupChildren="subcategories"
              optionGroupTemplate={groupedItemTemplate}
              placeholder="Wybierz podkategorię"
              showClear
              scrollHeight="500px"
            />
          </div>
          <div className="flex flex-column gap-2 mb-3">
            <label htmlFor="city">Miasto</label>
            <Dropdown
              id="city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.value)}
              options={cities}
              optionLabel="name"
              placeholder="Wybierz miasto"
              filter
              showClear
              scrollHeight="500px"
            />
            <small id="city-help">Wyszukiwanie w obszarze do 10 km od wybranego miasta</small>
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="sort">Sortuj</label>
            <Dropdown
              id="sort"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.value)}
              options={sortOptions}
              optionLabel="name"
              placeholder="Wybierz sortowanie"
              showClear
              scrollHeight="500px"
            />
          </div>
          <div className="mt-3">
            <Button
              label="Filtruj"
              size="small"
              icon="pi pi-search"
              severity="warning"
              className="w-full mb-2"
              onClick={filter}
              disabled={loading}
              data-cy="filter-btn"
            />
            <Button
              label="Resetuj"
              size="small"
              icon="pi pi-times"
              severity="secondary"
              className="w-full"
              onClick={resetFilters}
              disabled={loading}
              data-cy="reset-btn"
            />
          </div>
        </div>
        <div className="col-12 md:col-8 lg:col-9">
          {wallet.accounts.length > 0 && (
            <div className="h-4rem px-2">
              <Button
                label="Zatwierdź bilet"
                size="small"
                icon="pi pi-check"
                className="mr-2"
                onClick={() => setApproveTicketVisible(true)}
              />
            </div>
          )}
          <div className="flex justify-content-center">
            {events ? (
              <div
                className="grid w-full relative"
                style={{
                  maxWidth: "1200px",
                }}
                data-cy="result"
              >
                <div
                  className={`hidden absolute w-full h-full z-2 ${
                    loading ? "flex" : "hidden"
                  } justify-content-center align-items-center`}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <ProgressSpinner style={{ width: "50px", height: "50px" }} />
                </div>
                {events.results.length > 0 ? (
                  <>
                    {events.results.map((event) => (
                      <div key={event.idEvent} className="col-12 md:col-6 lg:col-4">
                        <Card className="text-center">
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
                              {event.likes}{" "}
                              {event.likes === 1
                                ? "polubienie"
                                : event.likes % 10 > 1 &&
                                  event.likes % 10 < 5 &&
                                  (event.likes % 100 < 11 || event.likes % 100 > 15)
                                ? "polubienia"
                                : "polubień"}
                            </Tag>
                          </div>
                          <p>Miasto: {event.cityName}</p>
                          <p>Cena: {formatBalance(event.ticketPrice)} ETH</p>
                          <p>Dostępne bilety: {event.remainingTicketCount}</p>
                          <p>Rozpoczyna się: {formatDatetime(new Date(event.start))}</p>
                          <div>
                            <Link to={`/events/${generateIdString(event.name, event.idEvent)}`}>
                              <Button
                                label="Przejdź do strony"
                                severity="info"
                                size="small"
                                icon="pi pi-link"
                                link
                              />
                            </Link>
                          </div>
                        </Card>
                      </div>
                    ))}
                    <Paginator
                      className="col-12 mt-5"
                      template={paginatorTemplate}
                      first={(page - 1) * rowsPerPage}
                      rows={rowsPerPage}
                      totalRecords={events.count}
                      onPageChange={onPageChange}
                    />
                  </>
                ) : (
                  <p className="w-full text-center">Nie znaleziono wydarzeń</p>
                )}
              </div>
            ) : (
              <div
                className="grid w-full"
                style={{
                  maxWidth: "1200px",
                }}
                data-cy="loading"
              >
                <div className="col-12 md:col-6 lg:col-4">
                  <CardSkeleton details />
                </div>
                <div className="col-12 md:col-6 lg:col-4">
                  <CardSkeleton details />
                </div>
                <div className="col-12 md:col-6 lg:col-4">
                  <CardSkeleton details />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ApproveTicketDialog
        toast={toast}
        header="Zatwierdź bilet"
        visible={approveTicketVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setApproveTicketVisible(false)}
        draggable={false}
      />
    </>
  )
}

export default Index
