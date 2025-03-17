import { validate as uuidValidate, version as uuidVersion } from "uuid"

import { Components } from "~/utils/types/openapi.ts"

// 1337
export const supportedChainId = import.meta.env.PROD ? 10 : 1337
export const domain = window.location.host
export const origin = window.location.origin

export const formatBalance = (rawBalance: string) => {
  const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(3)
  return balance
}

export const formatChainAsNum = (chainIdHex: string) => {
  const chainIdNum = parseInt(chainIdHex)
  return chainIdNum
}

export const formatChainAsHex = (chainId: number) => {
  const chainIdHex = `0x${chainId.toString(16)}`
  return chainIdHex
}

export const formatAddress = (address: string) => {
  return `${address.substring(0, 8)}...`
}

export enum UserRole {
  USER,
  EVENTS_ORGANIZER,
  ADMINISTRATOR,
}

export const userRoleToString = (userRole: Components.Schemas.UserRole) => {
  if (userRole === "EVENTS_ORGANIZER") {
    return "Organizator wydarzeń"
  } else if (userRole === "ADMINISTRATOR") {
    return "Administrator"
  }
  return "Użytkownik"
}

export const formatDatetime = (datetime: Date) => {
  return datetime.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  })
}

export function uuidValidateV4(uuid: string | undefined): boolean {
  return uuid !== undefined && uuidValidate(uuid) === true && uuidVersion(uuid) === 4
}

export function formatDate(date: Date): string {
  let day = date.getDate().toString(),
    month = (date.getMonth() + 1).toString()
  const year = date.getFullYear()

  if (month.length < 2) month = "0" + month
  if (day.length < 2) day = "0" + day

  return [year, month, day].join("-")
}

export function generateIdString(name: string, id: number): string {
  return `${encodeURIComponent(name.toLowerCase().split(" ").join("-"))}-${id}`
}

export function generateCountdownString(millis: number) {
  if (millis <= 0) {
    return "00 dni 00 godz. 00 min."
  }

  let processedMillis = millis

  const dayCount = Math.floor(processedMillis / 86400000).toString()
  processedMillis %= 86400000

  const hourCount = Math.floor(processedMillis / 3600000).toString()
  processedMillis %= 3600000

  const minuteCount = Math.floor(processedMillis / 60000).toString()

  let countdownString = ""

  if (dayCount.length === 1) {
    countdownString += "0"
  }
  countdownString += dayCount
  countdownString += " dni "

  if (hourCount.length === 1) {
    countdownString += "0"
  }
  countdownString += hourCount
  countdownString += " godz. "

  if (minuteCount.length === 1) {
    countdownString += "0"
  }
  countdownString += minuteCount
  countdownString += " min."

  return countdownString
}

export const pathToString = (path: string) => {
  switch (path) {
    case "Artists":
      return "Artyści"
    case "Events":
      return "Wydarzenia"
    case "Sign Up":
      return "Zarejestruj się"
    case "Profile":
      return "Profil"
    case "Tickets":
      return "Bilety"
    case "Followed Artists":
      return "Obserwowani artyści"
    case "Sales":
      return "Sprzedaż"
    case "Report":
      return "Raport"
    case "Users":
      return "Użytkownicy"
    case "Reviews To Approve":
      return "Recenzje do zatwierdzenia"
    case "Events To Approve":
      return "Wydarzenia do zatwierdzenia"
    default:
      return path
  }
}
