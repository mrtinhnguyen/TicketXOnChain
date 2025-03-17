import { useState } from "react"
import { Button } from "primereact/button"
import { Dialog, DialogProps } from "primereact/dialog"

function ConfirmDialog({
  visible,
  onHide,
  text,
  handleSubmit,
  ...props
}: Readonly<DialogProps & { text: string; handleSubmit: () => Promise<void> }>) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <div className="card">
        <div className="mb-5">
          <p>{text}</p>
        </div>
        <div>
          <Button
            label="Potwierdź"
            severity="danger"
            icon="pi pi-check"
            loading={submitted}
            className="mt-2 mr-3"
            onClick={async () => {
              setSubmitted(true)
              await handleSubmit()
              setSubmitted(false)
              onHide()
            }}
          />
          <Button
            label="Anuluj"
            severity="secondary"
            icon="pi pi-times"
            loading={submitted}
            className="mt-2"
            onClick={onHide}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default ConfirmDialog
