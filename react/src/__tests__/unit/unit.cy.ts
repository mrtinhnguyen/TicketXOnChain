// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  formatBalance,
  formatChainAsNum,
  formatChainAsHex,
  formatAddress,
  userRoleToString,
  uuidValidateV4,
  formatDate,
  generateIdString,
  generateCountdownString,
  pathToString,
} from "~/utils"

function testFunction(values: any[], expectedValues: any[], fn: (value: any) => any) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const expectedValue = expectedValues[i]

    expect(fn(value)).to.equals(expectedValue)
  }
}

describe("Testing helper functions", () => {
  it("test formatBalance values", () => {
    testFunction(
      [
        "1000000000000000000",
        "0",
        "333500000000000000",
        "333400000000000000",
        "2560000000000000000",
      ],
      ["1.000", "0.000", "0.334", "0.333", "2.560"],
      formatBalance
    )
  })

  it("test formatChainAsNum values", () => {
    testFunction(["0x1", "0x0", "0xf", "0x15", "0x539"], [1, 0, 15, 21, 1337], formatChainAsNum)
  })

  it("test formatChainAsHex values", () => {
    testFunction([1, 0, 15, 21, 1337], ["0x1", "0x0", "0xf", "0x15", "0x539"], formatChainAsHex)
  })

  it("test formatAddress values", () => {
    testFunction(
      [
        "0x0000000000000000000000000000000000000000",
        "0x5ba47Db8884B7a2313dCAd47a1FC403EDeA109C1",
        "0xEBbd52552B679228fDeEC320A31B2b1AA38E60ea",
      ],
      ["0x000000...", "0x5ba47D...", "0xEBbd52..."],
      formatAddress
    )
  })

  it("test userRoleToString values", () => {
    testFunction(
      ["EVENTS_ORGANIZER", "ADMINISTRATOR", "USER", "test"],
      ["Organizator wydarzeń", "Administrator", "Użytkownik", "Użytkownik"],
      userRoleToString
    )
  })

  it("test uuidValidateV4 valid values", () => {
    const validValues = [
      "ecb7da49-99d1-4de5-9aa9-5762f2a11cdd",
      "335b649c-e3c2-40bb-9a6f-a70a55715b52",
      "38e6d8b0-bb72-404b-9fc4-dcd2a3bf267a",
    ]

    for (const validValue of validValues) {
      expect(uuidValidateV4(validValue)).to.be.true
    }
  })

  it("test uuidValidateV4 invalid values", () => {
    const invalidValues = [
      undefined,
      null,
      "",
      "0",
      "test",
      "cf35ab7c345043a5ada88ee15697de78",
      "3dee6527-92b4-763e-81fc-f6b6af563780",
    ]

    for (const invalidValue of invalidValues) {
      expect(uuidValidateV4(invalidValue)).to.be.false
    }
  })

  it("test formatDate values", () => {
    testFunction(
      [new Date(0), new Date("2024-09-20 18:43:52"), new Date("2005 4 7")],
      ["1970-01-01", "2024-09-20", "2005-04-07"],
      formatDate
    )
  })

  it("test generateIdString values", () => {
    const values = [
      {
        name: "Test event",
        id: 0,
        expectedString: "test-event-0",
      },
      {
        name: 'Przykładowe wydarzenie "Święto miasta Katowice" !@#$%^&*()/\\',
        id: 121,
        expectedString:
          "przyk%C5%82adowe-wydarzenie-%22%C5%9Bwi%C4%99to-miasta-katowice%22-!%40%23%24%25%5E%26*()%2F%5C-121",
      },
      {
        name: "",
        id: 12321,
        expectedString: "-12321",
      },
    ]

    for (const value of values) {
      expect(generateIdString(value.name, value.id)).to.deep.equals(value.expectedString)
    }
  })

  it("test generateCountdownString values", () => {
    testFunction(
      [-4037000, 0, 203000, 63113000, 654782600],
      [
        "00 dni 00 godz. 00 min.",
        "00 dni 00 godz. 00 min.",
        "00 dni 00 godz. 03 min.",
        "00 dni 17 godz. 31 min.",
        "07 dni 13 godz. 53 min.",
      ],
      generateCountdownString
    )
  })

  it("test pathToString values", () => {
    testFunction(
      ["Artists", "Sign Up", "Users", "Reviews To Approve", "Test"],
      ["Artyści", "Zarejestruj się", "Użytkownicy", "Recenzje do zatwierdzenia", "Test"],
      pathToString
    )
  })
})
