import { useState, useEffect, useMemo, memo } from "react"
import { useNavigate, useOutletContext, Outlet } from "react-router-dom"
import { Menu } from "primereact/menu"
import { useMetaMask } from "~/hooks/useMetaMask"
import styles from "~/App.module.css"

const ProfileMenu = memo(function () {
  const navigate = useNavigate()
  const { user } = useMetaMask()

  const context = useOutletContext()

  const initialItems = useMemo(
    () => [
      {
        label: "Użytkownik",
        items: [
          {
            label: "Strona główna",
            icon: "pi pi-home",
            command: () => {
              navigate("/profile")
            },
          },
          {
            label: "Bilety",
            icon: "pi pi-ticket",
            command: () => {
              navigate("/profile/tickets")
            },
          },
          {
            label: "Obserwowani artyści",
            icon: "pi pi-eye",
            command: () => {
              navigate("/profile/followed-artists")
            },
          },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const [items, setItems] = useState<any[]>(initialItems)

  useEffect(() => {
    if (user) {
      const newItems = [...initialItems]

      if (user.role === "EVENTS_ORGANIZER") {
        newItems.push({
          label: "Organizator Wydarzeń",
          items: [
            {
              label: "Raport",
              icon: "pi pi-chart-line",
              command: () => {
                navigate("/profile/report")
              },
            },
            {
              label: "Sprzedaż",
              icon: "pi pi-book",
              command: () => {
                navigate("/profile/sales")
              },
            },
            {
              label: "Wydarzenia",
              icon: "pi pi-calendar",
              command: () => {
                navigate("/profile/events")
              },
            },
          ],
        })
      } else if (user.role === "ADMINISTRATOR") {
        newItems.push({
          label: "Administrator",
          items: [
            {
              label: "Artyści",
              icon: "pi pi-star",
              command: () => {
                navigate("/profile/artists")
              },
            },
            {
              label: "Użytkownicy",
              icon: "pi pi-users",
              command: () => {
                navigate("/profile/users")
              },
            },
            {
              label: "Recenzje do zatwierdzenia",
              icon: "pi pi-verified",
              command: () => {
                navigate("/profile/reviews-to-approve")
              },
            },
            {
              label: "Wydarzenia do zatwierdzenia",
              icon: "pi pi-verified",
              command: () => {
                navigate("/profile/events-to-approve")
              },
            },
          ],
        })
      }

      setItems(newItems)
    } else {
      setItems(initialItems)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-4 lg:col-3 relative mb-5 md:mb-0">
          <Menu model={items} className={`w-full sticky ${styles.profileMenu}`} />
        </div>
        <div className="col-12 md:col-8 lg:col-9">
          <Outlet context={context} />
        </div>
      </div>
    </>
  )
})

export default ProfileMenu
