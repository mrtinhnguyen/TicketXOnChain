import { useState, useEffect, useCallback } from "react"
import { Button } from "primereact/button"
import { Link } from "react-router-dom"
import { generateIdString } from "~/utils"
import client from "~/utils/client"
import CardSkeleton from "~/components/CardSkeleton"
import type { Paths } from "~/utils/types/openapi.d.ts"
import { InputText } from "primereact/inputtext"
import { Paginator } from "primereact/paginator"
import { ProgressSpinner } from "primereact/progressspinner"
import { Card } from "primereact/card"
import { Image } from "primereact/image"
import styles from "~/App.module.css"

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

function Artists() {
  const [artists, setArtists] = useState<Paths.ListArtists.Responses.$200 | null>(null)

  const [search, setSearch] = useState<string>("")

  const [filters, setFilters] = useState<object>({})

  const [loading, setLoading] = useState<boolean>(false)

  const [rowsPerPage] = useState(3)
  const [page, setPage] = useState(1)

  const handleListArtists = useCallback(async () => {
    setLoading(true)
    setArtists(null)
    const result = await client.ListArtists({
      search: search !== "" ? search : undefined,
      page,
    })
    setArtists(result.data)
    setLoading(false)
  }, [search, page])

  useEffect(() => {
    if (artists) {
      setPage(artists.currentPage)
    }
  }, [artists])

  const filter = () => {
    setPage(1)
    setFilters({})
  }

  const resetFilters = () => {
    setSearch("")
    setPage(1)
    setFilters({})
  }

  useEffect(() => {
    handleListArtists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const onPageChange = useCallback((event: any) => {
    setPage(event.first / 3 + 1)
    setFilters({})
  }, [])

  return (
    <div className="grid">
      <div className="col-12 md:col-6 lg:col-3 mb-5 md:mb-0">
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
      <div className="col-12 md:col-6 lg:col-9">
        <div className="flex justify-content-center">
          {artists ? (
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
              {artists.results.length > 0 ? (
                <>
                  {artists.results.map((artist) => (
                    <div key={artist.idArtist} className="col-12 md:col-6 lg:col-4">
                      <Card className="text-center">
                        <Link to={`/artists/${generateIdString(artist.name, artist.idArtist)}`}>
                          <Image
                            loading="lazy"
                            src={artist.pictureUrl}
                            alt={artist.name}
                            className={styles.previewImageContainer}
                            imageClassName={styles.image}
                          />
                        </Link>
                        <h4>{artist.name}</h4>
                        <div>
                          <Link to={`/artists/${generateIdString(artist.name, artist.idArtist)}`}>
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
                    totalRecords={artists.count}
                    onPageChange={onPageChange}
                  />
                </>
              ) : (
                <p className="w-full text-center">Nie znaleziono artystów</p>
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
                <CardSkeleton details={false} />
              </div>
              <div className="col-12 md:col-6 lg:col-4">
                <CardSkeleton details={false} />
              </div>
              <div className="col-12 md:col-6 lg:col-4">
                <CardSkeleton details={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Artists
