describe("End to End tests", () => {
  it("should visit", () => {
    cy.visit("/")
  })

  it("header install metamask link", () => {
    cy.visit("/")

    const header = cy.get('[data-cy="header"]')
    header.contains("Zainstaluj MetaMask").should("exist")
  })

  it("filter events", () => {
    cy.visit("/")

    const result = cy.get('[data-cy="result"]')
    const search = cy.get('[data-cy="search"]')
    const filterBtn = cy.get('[data-cy="filter-btn"]')
    const resetBtn = cy.get('[data-cy="reset-btn"]')

    search.type("Test event")

    filterBtn.click()

    result.contains("Nie znaleziono wydarzeń").should("exist")

    resetBtn.click()

    cy.get('[data-cy="loading"]').should("not.exist")
  })

  it("visit artists", () => {
    cy.visit("/")

    const header = cy.get('[data-cy="header"]')
    header.contains("Artyści").click()

    cy.url().should("include", "/artists")

    const breadcrumb = cy.get('[data-cy="breadcrumb"]')

    breadcrumb.contains("Artyści").should("exist")
  })

  it("filter artists", () => {
    cy.visit("/artists")

    const result = cy.get('[data-cy="result"]')
    const search = cy.get('[data-cy="search"]')
    const filterBtn = cy.get('[data-cy="filter-btn"]')
    const resetBtn = cy.get('[data-cy="reset-btn"]')

    search.type("Test artist")

    filterBtn.click()

    result.contains("Nie znaleziono artystów").should("exist")

    resetBtn.click()

    cy.get('[data-cy="loading"]').should("not.exist")
  })
})
