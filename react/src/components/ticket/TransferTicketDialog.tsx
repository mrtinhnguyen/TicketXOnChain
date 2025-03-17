import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputText } from "primereact/inputtext"
import { Button } from "primereact/button"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useMetaMask } from "~/hooks/useMetaMask"
import Ticket from "~/utils/ticket"

const transferTicketSchema = Yup.object().shape({
  address: Yup.string()
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/, "Nieprawidłowy format adresu portfela")
    .required("Adres portfela jest wymagany"),
})

interface ITransferTicket {
  address: string
}

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface ITicketProp {
  ticket: any
}

interface IToastProp {
  toast: RefObject<Toast>
}

type Props = ITicketProp & IToastProp & IRevalidateProp & DialogProps

function TransferTicketDialog({
  ticket,
  toast,
  revalidate,
  visible,
  onHide,
  ...props
}: Readonly<Props>) {
  const { wallet } = useMetaMask()

  const [transferingTicket, setTransferingTicket] = useState(false)
  const [scanningQRCode, setScanningQRCode] = useState(false)

  useEffect(() => {
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleTransferTicket = useCallback(
    async (data: ITransferTicket) => {
      if (window.web3 !== undefined && wallet.accounts.length > 0) {
        const contract = new window.web3.eth.Contract(Ticket, ticket!.ticketAddress)
        contract.handleRevert = true

        try {
          const transferFromMethod = contract.methods.transferFrom(
            wallet.accounts[0],
            data.address,
            ticket!.tokenId
          )

          setTransferingTicket(true)
          await transferFromMethod.call({
            from: wallet.accounts[0],
          })
          await transferFromMethod.send({
            from: wallet.accounts[0],
          })

          formik.resetForm()
          onHide()
        } catch (error: any) {
          console.error(error)
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: error.data?.message || error.message,
          })
        } finally {
          await revalidate()
          setTransferingTicket(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet, ticket]
  )

  const formik = useFormik<ITransferTicket>({
    initialValues: {
      address: "",
    },
    validationSchema: transferTicketSchema,
    onSubmit: handleTransferTicket,
  })

  const isFormFieldValid = (name: keyof ITransferTicket) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof ITransferTicket) => {
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
                Adres odbiorcy*
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

        <Button type="submit" label="Potwierdź" className="mt-2" loading={transferingTicket} />
      </form>
    </Dialog>
  )
}

export default TransferTicketDialog
