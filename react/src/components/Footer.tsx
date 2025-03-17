import { memo } from "react"

const Footer = memo(function () {
  return (
    <footer className="col-12 p-3 bg-gray-900 -mt-6">
      <div
        className="text-center text-white text-sm mx-auto"
        style={{
          maxWidth: "1440px",
        }}
      >
        <a
          href="https://github.com/dominikjalowiecki"
          rel="noreferrer"
          target="_blank"
          className="text-white"
          data-cy="footer-link"
        >
          Dominik Jałowiecki &copy; 2024 v1.0
        </a>
      </div>
    </footer>
  )
})

export default Footer
