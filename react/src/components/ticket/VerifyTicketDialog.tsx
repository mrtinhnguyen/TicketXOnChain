import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputText } from "primereact/inputtext"
import { Button } from "primereact/button"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { ProgressSpinner } from "primereact/progressspinner"
import { ToggleButton } from "primereact/togglebutton"
import { Card } from "primereact/card"
import { Tag } from "primereact/tag"
import { ProgressBar } from "primereact/progressbar"
import { useFormik } from "formik"
import { v4 as uuid } from "uuid"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import QRCode from "react-qr-code"
import type { Components, Paths } from "~/utils/types/openapi.d.ts"
import client from "~/utils/client"

const transferTicketSchema = Yup.object().shape({
  address: Yup.string()
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/, "Nieprawidłowy format adresu portfela")
    .required("Adres portfela jest wymagany"),
})

export interface IVerifyTicket {
  address: string
}

interface IEventProp {
  event: Components.Schemas.GetEvent
}

interface IToastProp {
  toast: RefObject<Toast>
}

type Props = IEventProp & IToastProp & DialogProps

function VerifyTicketDialog({ event, toast, visible, onHide, ...props }: Readonly<Props>) {
  const [verifyingTicket, setVerifyingTicket] = useState(false)
  const [scanningQRCode, setScanningQRCode] = useState(false)
  const [activeMode, setActiveMode] = useState(false)
  const [result, setResult] = useState<Paths.PassiveTicketVerification.Responses.$200 | null>(null)

  const [ticketApprovalSubscriptionUuid, setTicketApprovalSubscriptionUuid] = useState("")
  const [ticketApprovalSubscriptionTimeout, setTicketApprovalSubscriptionTimeout] = useState(0)

  useEffect(() => {
    setActiveMode(false)
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    let activeModeRecursion: any = {
      enabled: false,
    }
    let ticketApprovalSubscriptionTimeoutInterval: any = null
    let controller: any = null

    const subscribeToTicketApproval = async () => {
      try {
        const newUuid = uuid()
        setTicketApprovalSubscriptionUuid(newUuid)
        setTicketApprovalSubscriptionTimeout(15000)

        controller = new AbortController()
        const result = await client.ActiveTicketVerification(
          {
            id: event!.idEvent,
          },
          {
            uuid: newUuid,
          }
        )

        if (activeModeRecursion?.enabled) {
          if (result.status !== 204) {
            setResult(result.data as Components.Schemas.TicketVerificationResult)
          }
          subscribeToTicketApproval()
        }
      } catch (error: any) {
        console.error(error)
        if (axios.isAxiosError(error)) {
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: (error as AxiosError<{ message?: string }>).response?.data.message,
          })
        }
      }
    }

    setResult(null)
    setTicketApprovalSubscriptionUuid("")
    setTicketApprovalSubscriptionTimeout(0)
    if (activeMode && visible) {
      activeModeRecursion.enabled = true
      ticketApprovalSubscriptionTimeoutInterval = setInterval(function () {
        setTicketApprovalSubscriptionTimeout((currentValue) =>
          currentValue - 1000 > 0 ? currentValue - 1000 : 0
        )
      }, 1000)
      subscribeToTicketApproval()
    }
    return () => {
      if (controller) {
        controller.abort()
        controller = null
      }

      activeModeRecursion.enabled = false
      activeModeRecursion = null

      clearInterval(ticketApprovalSubscriptionTimeoutInterval)
      ticketApprovalSubscriptionTimeoutInterval = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, visible, event])

  const handleVerifyTicket = useCallback(
    async (data: IVerifyTicket) => {
      try {
        setVerifyingTicket(true)
        const result = await client.PassiveTicketVerification(
          {
            id: event.idEvent,
          },
          {
            publicAddress: data.address,
          }
        )
        setResult(result.data)
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
        setVerifyingTicket(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event]
  )

  const formik = useFormik<IVerifyTicket>({
    initialValues: {
      address: "",
    },
    validationSchema: transferTicketSchema,
    onSubmit: handleVerifyTicket,
  })

  const isFormFieldValid = (name: keyof IVerifyTicket) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof IVerifyTicket) => {
    return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>
  }

  const handleQRCodeScanner = useCallback(async () => {
    try {
      setScanningQRCode(true)
      const address = await window.ethereum.request({
        method: "wallet_scanQRCode",
        params: [],
      })
      formik.setFieldValue("", address)
    } catch (error: any) {
      console.error(error)
      toast.current?.show({
        severity: "error",
        summary: "Komunikat o błędzie",
        detail: error.message,
      })
    } finally {
      setScanningQRCode(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <ToggleButton
        onLabel="Tryb aktywny"
        offLabel="Tryb pasywny"
        checked={activeMode}
        className="p-button-sm mb-3"
        onChange={(e) => setActiveMode(e.value)}
      />
      {activeMode ? (
        <div>
          {ticketApprovalSubscriptionUuid ? (
            <div style={{ margin: "0 auto", maxWidth: "200px", width: "100%" }}>
              <div
                className="p-3 border-1"
                style={{
                  height: "auto",

                  background: "#fff",
                }}
              >
                <QRCode
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={ticketApprovalSubscriptionUuid}
                />
              </div>
              <div className="bg-primary border-round-xl	px-2">
                <p
                  className="text-center"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ticketApprovalSubscriptionUuid}
                </p>
              </div>
              <ProgressBar
                value={(ticketApprovalSubscriptionTimeout / 15000) * 100}
                showValue={false}
              ></ProgressBar>
            </div>
          ) : (
            <ProgressSpinner style={{ width: "32px", height: "32px" }} />
          )}
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="p-fluid pt-4">
          <div className="field mb-5">
            <div className="p-inputgroup flex-1">
              <span className="p-float-label">
                <InputText
                  id="address"
                  name="address"
                  maxLength={42}
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  autoFocus
                  className={classNames({ "p-invalid": isFormFieldValid("address") })}
                />
                <label
                  htmlFor="name"
                  className={classNames({ "p-error": isFormFieldValid("address") })}
                >
                  Adres właściciela*
                </label>
              </span>
              <Button
                severity="danger"
                type="button"
                size="small"
                icon="pi pi-camera"
                aria-label="Skanuj kod QR"
                onClick={handleQRCodeScanner}
                loading={scanningQRCode}
              />
            </div>
            {getFormErrorMessage("address")}
          </div>

          <Button type="submit" label="Potwierdź" className="mt-2" loading={verifyingTicket} />
        </form>
      )}
      <Card className="surface-200 mt-4">
        {result && (
          <>
            {result.hasTicket ? (
              <>
                <Tag severity="success" icon="pi pi-check" className="text-base w-full">
                  Użytkownik posiada bilet
                </Tag>
                {result.isTicketUsed ? (
                  <Tag icon="pi pi-flag" severity="danger" className="mt-3" rounded>
                    Bilet został już wykorzystany
                  </Tag>
                ) : (
                  <>
                    {result.isTicketUsed !== null && (
                      <>
                        {activeMode ? (
                          <Tag icon="pi pi-flag" severity="warning" className="mt-3" rounded>
                            Bilet został właśnie wykorzystany
                          </Tag>
                        ) : (
                          <Tag icon="pi pi-flag" severity="success" className="mt-3" rounded>
                            Bilet nie został wykorzystany
                          </Tag>
                        )}
                      </>
                    )}
                  </>
                )}
                {result.user !== null ? (
                  <>
                    <p>Adres email: {result.user.email}</p>
                    <p>
                      Imię i nazwisko: {result.user.name} {result.user.surname}
                    </p>
                    <p className="mb-0">Data urodzenia: {result.user.birthdate}</p>
                  </>
                ) : (
                  <p className="mb-0">Nie znaleziono danych użytkownika</p>
                )}
              </>
            ) : (
              <Tag severity="danger" icon="pi pi-times" className="text-base w-full">
                Użytkownik nie posiada biletu
              </Tag>
            )}
          </>
        )}
      </Card>
    </Dialog>
  )
}

export default VerifyTicketDialog
