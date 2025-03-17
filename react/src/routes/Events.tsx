import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { Tag } from "primereact/tag"
import { useOutletContext, Link } from "react-router-dom"
import { generateIdString, formatDatetime } from "~/utils"
import client from "~/utils/client"
import { Button } from "primereact/button"
import CreateEventDialog from "~/components/event/CreateEventDialog"
import EditEventDialog from "~/components/event/EditEventDialog"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { InputText } from "primereact/inputtext"
import { Toolbar } from "primereact/toolbar"
import type { Paths } from "~/utils/types/openapi.d.ts"
import { IconField } from "primereact/iconfield"
import { InputIcon } from "primereact/inputicon"
import type { SelectItemOptionsType } from "primereact/selectitem"
import { Dropdown } from "primereact/dropdown"

function groupedItemTemplate(option: any) {
  return (
    <div className="flex align-items-center">
      <div>{option.optionGroup.name}</div>
    </div>
  )
}

function Events() {
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const [createEventVisible, setCreateEventVisible] = useState(false)
  const [editEventVisible, setEditEventVisible] = useState(false)

  const [events, setEvents] = useState<Paths.ListUserEvents.Responses.$200 | null>(null)
  const [selectedIdEvent, setSelectedIdEvent] = useState<number | null>(null)

  const editEventButtonTemplate = useCallback(
    (event: any) => (
      <>
        <Button
          label="Edytuj"
          severity="danger"
          size="small"
          icon="pi pi-external-link"
          onClick={() => {
            setSelectedIdEvent(event.idEvent)
            setEditEventVisible(true)
          }}
          className="mr-2"
        />
        <Link to={`/events/${generateIdString(event.name, event.idEvent)}`}>
          <Button label="Przejdź do strony" severity="info" size="small" icon="pi pi-link" link />
        </Link>
      </>
    ),
    []
  )

  const [search, setSearch] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    { idSubcategory: number; name: string } | undefined
  >()
  const [selectedCity, setSelectedCity] = useState<{ idCity: number; name: string } | undefined>()

  const [filters, setFilters] = useState<object>({})

  const [loading, setLoading] = useState<boolean>(false)

  const [rowsPerPage] = useState(3)
  const [page, setPage] = useState(1)

  const handleListEvents = useCallback(async () => {
    setLoading(true)
    setEvents(null)
    const result = await client.ListUserEvents({
      search: search !== "" ? search : undefined,
      idSubcategory: selectedSubcategory?.idSubcategory,
      idCity: selectedCity?.idCity,
      page,
    })
    setEvents(result.data)
    setLoading(false)
  }, [search, selectedSubcategory, selectedCity, page])

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
    setPage(1)
    setFilters({})
  }

  useEffect(() => {
    handleListEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const [categories, setCategories] = useState<SelectItemOptionsType | undefined>(undefined)
  const [cities, setCities] = useState<SelectItemOptionsType | undefined>(undefined)

  useEffect(() => {
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

    handleListCategories()
    handleListCities()
  }, [])

  const startContent = (
    <Button
      icon="pi pi-plus"
      aria-label="Utwórz"
      onClick={() => {
        setCreateEventVisible(true)
      }}
    />
  )

  const centerContent = (
    <div className="flex flex-wrap">
      <IconField iconPosition="left" className="w-full md:w-14rem md:mr-2 mb-2 md:m-0">
        <InputIcon className="pi pi-search" aria-label="Szukaj" />
        <InputText
          id="search"
          type="search"
          placeholder="Szukaj"
          className="w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </IconField>
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
        className="w-full md:w-14rem md:mr-2 mb-2 md:m-0"
        showClear
        scrollHeight="500px"
      />
      <Dropdown
        id="city"
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.value)}
        options={cities}
        optionLabel="name"
        placeholder="Wybierz miasto"
        className="w-full md:w-14rem md:mr-2"
        filter
        showClear
        scrollHeight="500px"
      />
    </div>
  )

  const endContent = (
    <>
      <Button
        label="Filtruj"
        size="small"
        icon="pi pi-search"
        severity="warning"
        className="mr-2"
        onClick={filter}
        disabled={loading}
      />
      <Button
        label="Resetuj"
        size="small"
        icon="pi pi-times"
        severity="secondary"
        onClick={resetFilters}
        disabled={loading}
      />
    </>
  )

  const onPage = useCallback((event: any) => {
    setPage(event.first / 3 + 1)
    setFilters({})
  }, [])

  return (
    <>
      <h2 className="mt-0">Wydarzenia</h2>
      <div className="mb-5">
        <Toolbar start={startContent} center={centerContent} end={endContent} />
      </div>
      <DataTable
        value={events?.results}
        paginator
        rows={rowsPerPage}
        first={(page - 1) * rowsPerPage}
        totalRecords={events?.count}
        onPage={onPage}
        tableStyle={{ minWidth: "50rem" }}
        loading={loading}
        lazy
        emptyMessage="Nie znaleziono wydarzeń"
      >
        <Column field="name" header="Nazwa"></Column>
        <Column field="subcategoryName" header="Podkategoria"></Column>
        <Column field="cityName" header="Miasto"></Column>
        <Column
          header="Rozpoczyna się"
          body={(event: any) => formatDatetime(new Date(event.start))}
        ></Column>
        <Column
          header="Wdrożono"
          body={(event: any) =>
            event.contractAddress ? (
              <Tag severity="success">Tak</Tag>
            ) : (
              <Tag severity="danger">Nie</Tag>
            )
          }
        ></Column>
        <Column
          header="Szkic"
          body={(event: any) =>
            event.draft ? <Tag severity="danger">Tak</Tag> : <Tag severity="success">Nie</Tag>
          }
        ></Column>
        <Column header="Opcje" body={editEventButtonTemplate}></Column>
      </DataTable>
      <CreateEventDialog
        revalidate={handleListEvents}
        toast={toast}
        header="Utwórz wydarzenie"
        visible={createEventVisible}
        style={{ width: "100%", maxWidth: "800px" }}
        className="m-3"
        onHide={() => setCreateEventVisible(false)}
        draggable={false}
      />
      <EditEventDialog
        revalidate={handleListEvents}
        toast={toast}
        idEvent={selectedIdEvent}
        header="Edytuj wydarzenie"
        visible={editEventVisible}
        style={{ width: "100%", maxWidth: "800px" }}
        className="m-3"
        onHide={() => setEditEventVisible(false)}
        draggable={false}
      />
    </>
  )
}

export default Events
