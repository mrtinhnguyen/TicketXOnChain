import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { Button } from "primereact/button"
import { ProgressSpinner } from "primereact/progressspinner"
import { Dialog, DialogProps } from "primereact/dialog"
import { formatBalance } from "~/utils"
import Ticket from "~/utils/ticket"
import { useMetaMask } from "~/hooks/useMetaMask"
import type { Components } from "~/utils/types/openapi.d.ts"

interface IEventProp {
  event: Components.Schemas.GetEvent
}

interface IToastProp {
  toast: RefObject<Toast>
}

type Props = IEventProp & IToastProp & DialogProps

function PreviewFundsDialog({ event, toast, visible, onHide, ...props }: Readonly<Props>) {
  const { wallet } = useMetaMask()

  const [eventFunds, setEventFunds] = useState<bigint | null>(null)
  const [withdrawingFunds, setWithdrawingFunds] = useState(false)

  const getEventFunds = useCallback(async () => {
    if (window.web3 !== undefined && wallet.accounts.length > 0) {
      try {
        const eventFunds = await window.web3.eth.getBalance(event.contractAddress!)
        setEventFunds(eventFunds)
      } catch (error: any) {
        console.error(error)
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: error.data?.message || error.message,
        })
        onHide()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, event])

  useEffect(() => {
    if (visible) {
      setEventFunds(null)
      getEventFunds()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleWithdrawFunds = useCallback(async () => {
    if (window.web3 !== undefined && wallet.accounts.length > 0) {
      const contract = new window.web3.eth.Contract(Ticket, event.contractAddress!)
      contract.handleRevert = true

      const transferFundsMethod = contract.methods.transferFunds(wallet.accounts[0], eventFunds!)
      try {
        setWithdrawingFunds(true)
        await transferFundsMethod.call({
          from: wallet.accounts[0],
        })
        await transferFundsMethod.send({
          from: wallet.accounts[0],
        })
      } catch (error: any) {
        console.error(error)
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: error.data?.message || error.message,
        })
      } finally {
        await getEventFunds()
        setWithdrawingFunds(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, event, eventFunds])

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <div className="flex flex-column justify-content-center">
        {eventFunds !== null ? (
          <>
            <p>Środki: {formatBalance(eventFunds.toString())} ETH</p>
            <Button
              label="Wypłać środki"
              icon="pi pi-money-bill"
              disabled={eventFunds === BigInt(0)}
              loading={withdrawingFunds}
              onClick={() => handleWithdrawFunds()}
            />
          </>
        ) : (
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        )}
      </div>
    </Dialog>
  )
}

export default PreviewFundsDialog
