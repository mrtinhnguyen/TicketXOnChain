import { useState, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { ProgressSpinner } from "primereact/progressspinner"
import { useOutletContext, Link } from "react-router-dom"
import axios from "axios"
import { generateIdString } from "~/utils"
import client from "~/utils/client"
import { useMetaMask } from "~/hooks/useMetaMask"
import { Button } from "primereact/button"
import { Carousel } from "primereact/carousel"
import type { AxiosError } from "axios"
import { Image } from "primereact/image"
import styles from "~/App.module.css"

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

function FollowedArtists() {
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()
  const { followedArtists, revalidateFollowedArtists } = useMetaMask()

  const followedArtistTemplate = useCallback(
    (artist: any) => {
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
          <h4 className="mb-3">{artist.name}</h4>
          {followedArtists && (
            <>
              {followedArtists.find(
                (followedArtist) => followedArtist.idArtist === artist.idArtist
              ) ? (
                <Button
                  label="Odobserwuj artystę"
                  onClick={() => handleUnfollowArtist(artist.idArtist)}
                  icon="pi pi-eye-slash"
                  severity="danger"
                  loading={followingArtist}
                />
              ) : (
                <Button
                  label="Zaobserwuj artystę"
                  onClick={() => handleFollowArtist(artist.idArtist)}
                  icon="pi pi-eye"
                  severity="success"
                  loading={followingArtist}
                />
              )}
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-2 justify-content-center">
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
        </div>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followedArtists]
  )

  const [followingArtist, setFollowingArtist] = useState<boolean>(false)

  const handleFollowArtist = useCallback(async (idArtist: number) => {
    try {
      setFollowingArtist(true)
      await client.FollowArtist({ id: idArtist })
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
  }, [])

  const handleUnfollowArtist = useCallback(async (idArtist: number) => {
    try {
      setFollowingArtist(true)
      await client.UnfollowArtist({ id: idArtist })
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
  }, [])

  return (
    <>
      <h2 className="mt-0">Obserwowani artyści</h2>
      {followedArtists ? (
        <div className="card">
          {followedArtists.length > 0 ? (
            <Carousel
              value={followedArtists}
              numVisible={3}
              numScroll={1}
              responsiveOptions={responsiveOptions}
              itemTemplate={followedArtistTemplate}
            />
          ) : (
            <p className="text-center">Nie znaleziono obserwowanych artystów</p>
          )}
        </div>
      ) : (
        <div className="flex justify-content-center align-items-center">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        </div>
      )}
    </>
  )
}

export default FollowedArtists
