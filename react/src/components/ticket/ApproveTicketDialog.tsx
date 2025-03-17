import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputText } from "primereact/inputtext"
import { Button } from "primereact/button"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import { uuidValidateV4 } from "~/utils"
import { useMetaMask } from "~/hooks/useMetaMask"
import client from "~/utils/client"
import type { Components } from "~/utils/types/openapi.d.ts"

const approveTicketSchema = Yup.object().shape({
  uuid: Yup.string()
    .test("is-valid-uuid", "Nieprawidłowy format identyfikatora UUID", uuidValidateV4)
    .required("Identyfikator UUID jest wymagany"),
})

interface IToastProp {
  toast: RefObject<Toast>
}

type Props = IToastProp & DialogProps

interface IUuid {
  uuid: Components.Schemas.UUID
}

function ApproveTicketDialog({ toast, visible, onHide, ...props }: Readonly<Props>) {
  const { wallet } = useMetaMask()

  const [approvingTicket, setApprovingTicket] = useState(false)
  const [scanningQRCode, setScanningQRCode] = useState(false)

  useEffect(() => {
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleApproveTicket = useCallback(
    async (data: IUuid) => {
      if (window.web3 !== undefined && wallet.accounts.length > 0) {
        const { uuid } = data
        let signature
        try {
          setApprovingTicket(true)
          signature = await window.web3.eth.personal.sign(uuid, wallet.accounts[0], "")
        } catch (error: any) {
          console.error(error)
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: error.message,
          })
          setApprovingTicket(false)
          return
        }

        try {
          await client.ApproveActiveTicketVerification(undefined, {
            uuid,
            signature,
          })

          toast.current?.show({
            severity: "success",
            summary: "Komunikat o powodzeniu",
            detail: "Pomyślnie zatwierdzono bilet",
          })

          formik.resetForm()
          onHide()
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
          setApprovingTicket(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet]
  )

  const formik = useFormik<IUuid>({
    initialValues: {
      uuid: "",
    },
    validationSchema: approveTicketSchema,
    onSubmit: handleApproveTicket,
  })

  const isFormFieldValid = (name: keyof IUuid) => !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof IUuid) => {
    return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>
  }

  const handleQRCodeScanner = useCallback(async () => {
    try {
      setScanningQRCode(true)
      const uuid = await window.ethereum.request({
        method: "wallet_scanQRCode",
        params: ["^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"],
      })
      formik.setFieldValue("uuid", uuid)
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
      <form onSubmit={formik.handleSubmit} className="p-fluid pt-4">
        <div className="field mb-5">
          <div className="p-inputgroup flex-1">
            <span className="p-float-label">
              <InputText
                id="uuid"
                name="uuid"
                maxLength={36}
                value={formik.values.uuid}
                onChange={formik.handleChange}
                autoFocus
                className={classNames({ "p-invalid": isFormFieldValid("uuid") })}
              />
              <label htmlFor="name" className={classNames({ "p-error": isFormFieldValid("uuid") })}>
                Identyfikator UUID*
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
          {getFormErrorMessage("uuid")}
        </div>

        <p className="text-xs text-color-secondary">Spowoduje to wykorzystanie Twojego biletu</p>
        <Button type="submit" label="Potwierdź" className="mt-2" loading={approvingTicket} />
      </form>
    </Dialog>
  )
}

export default ApproveTicketDialog
