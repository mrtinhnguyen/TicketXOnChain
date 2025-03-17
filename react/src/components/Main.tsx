import { Outlet } from "react-router-dom"
import { useRef, useState, useEffect } from "react"
import { Toast } from "primereact/toast"
import { BreadCrumb } from "primereact/breadcrumb"
import { useLocation, NavLink } from "react-router-dom"
import { useMetaMask } from "~/hooks/useMetaMask"
import { pathToString } from "~/utils"
import { addLocale, locale } from "primereact/api"
import Header from "~/components/Header"
import Footer from "~/components/Footer"
import pl from "primelocale/pl.json"

const home = {
  template: () => (
    <NavLink to="/" aria-label="Strona główna">
      <i className="pi pi-home"></i>
    </NavLink>
  ),
}

function Main() {
  const location = useLocation()
  const { clearError } = useMetaMask()

  addLocale("pl", pl.pl)
  locale("pl")

  const toast = useRef<Toast>(null)

  const handleToastRemove = () => clearError()

  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const newItems = []
    const splittedLocation = location.pathname.split("/")
    let buildLink = ""
    for (const path of splittedLocation) {
      if (path === "activate") {
        break
      }

      if (path) {
        const splittedPath = decodeURIComponent(path)
          .split("-")
          .map((path) => path.charAt(0).toUpperCase() + path.slice(1))
        let label = splittedPath.join(" ")

        buildLink += `/${path}`
        const link = buildLink

        label = pathToString(label)

        newItems.push({
          label,
          template: () => (
            <NavLink to={link}>
              <span className="text-primary font-semibold">{label}</span>
            </NavLink>
          ),
        })
      }
    }

    setItems(newItems)
  }, [location])

  return (
    <>
      <Toast ref={toast} onRemove={handleToastRemove} position="bottom-right" />
      <div className="grid grid-nogutter">
        <Header toast={toast} />
        <main className="col-12 min-h-screen pb-6 pt-8">
          {items.length > 0 && (
            <div className="bg-white">
              <BreadCrumb
                model={items}
                home={home}
                className="border-noround border-none mx-auto"
                style={{
                  maxWidth: "1440px",
                }}
                data-cy="breadcrumb"
              />
            </div>
          )}
          <div
            className="px-3 py-5 mx-auto"
            style={{
              maxWidth: "1440px",
            }}
          >
            <Outlet context={{ toast }} />
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Main
