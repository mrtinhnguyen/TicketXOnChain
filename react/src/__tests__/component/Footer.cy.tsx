import Footer from "../../components/Footer"

describe("<Footer />", () => {
  it("renders", () => {
    cy.mount(<Footer />)
    cy.get('[data-cy="footer-link"]').should("have.text", "Dominik Jałowiecki © 2024 v1.0")
  })
})
