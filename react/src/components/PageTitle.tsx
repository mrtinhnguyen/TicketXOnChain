import { useEffect, memo } from "react"
import { useLocation } from "react-router-dom"

const PageTitle = memo(function ({ title }: { title?: string }) {
  const location = useLocation()

  useEffect(() => {
    document.title = title
      ? `${title} - Aplikacja do sprzedaży biletów`
      : "Aplikacja do sprzedaży biletów"
  }, [location, title])

  return null
})

export default PageTitle
