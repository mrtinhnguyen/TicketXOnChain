import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputText } from "primereact/inputtext"
import { InputTextarea } from "primereact/inputtextarea"
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import type { Paths } from "~/utils/types/openapi.d.ts"
import { formatDate } from "~/utils"
import client from "~/utils/client"
import { Rating } from "primereact/rating"

const createReviewSchema = Yup.object().shape({
  title: Yup.string().trim().max(85).required("Tytuł jest wymagany"),
  eventLocation: Yup.string().trim().max(120).required("Lokalizacja jest wymagana"),
  eventDate: Yup.date().required("Data jest wymagana"),
  content: Yup.string().trim().max(1000).required("Treść jest wymagana"),
  rate: Yup.number().integer().min(1).max(5).required("Ocena jest wymagana"),
})

interface IToastProp {
  toast: RefObject<Toast>
}

interface IArtistProp {
  idArtist: number
}

type CreateReviewRequest = Omit<Paths.CreateReview.RequestBody, "rate"> & {
  rate: number | undefined
}

type Props = IToastProp & IArtistProp & DialogProps

function CreateReviewDialog({ toast, idArtist, visible, onHide, ...props }: Readonly<Props>) {
  const [creatingReview, setCreatingReview] = useState(false)

  useEffect(() => {
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleCreateReview = useCallback(
    async (data: CreateReviewRequest) => {
      try {
        setCreatingReview(true)

        await client.CreateReview(
          {
            id: idArtist,
          },
          {
            title: data.title,
            eventLocation: data.eventLocation,
            eventDate: formatDate(new Date(data.eventDate)),
            content: data.content,
            rate: data.rate!,
          }
        )

        toast.current?.show({
          severity: "success",
          summary: "Komunikat o powodzeniu",
          detail:
            "Pomyślnie utworzono recenzję, będzie ona dostępna po zatwierdzeniu przez administrację",
        })

        onHide()
        formik.resetForm()
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
        setCreatingReview(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idArtist]
  )

  const formik = useFormik<CreateReviewRequest>({
    initialValues: {
      title: "",
      eventLocation: "",
      eventDate: new Date().toISOString(),
      content: "",
      rate: undefined,
    },
    validationSchema: createReviewSchema,
    onSubmit: handleCreateReview,
  })

  const isFormFieldValid = (name: keyof CreateReviewRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof CreateReviewRequest) => {
    return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>
  }

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <form onSubmit={formik.handleSubmit} className="p-fluid pt-4">
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="title"
              name="title"
              maxLength={85}
              value={formik.values.title}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("title") })}
            />
            <label htmlFor="title" className={classNames({ "p-error": isFormFieldValid("title") })}>
              Tytuł*
            </label>
          </span>
          {getFormErrorMessage("title")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="eventLocation"
              name="eventLocation"
              maxLength={85}
              value={formik.values.eventLocation}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("eventLocation") })}
            />
            <label
              htmlFor="eventLocation"
              className={classNames({ "p-error": isFormFieldValid("eventLocation") })}
            >
              Lokalizacja*
            </label>
          </span>
          {getFormErrorMessage("eventLocation")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <Calendar
              id="eventDate"
              name="eventDate"
              maxDate={new Date()}
              value={new Date(formik.values.eventDate)}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("eventDate") })}
              dateFormat="dd.mm.yy"
            />
            <label
              htmlFor="eventDate"
              className={classNames({ "p-error": isFormFieldValid("eventDate") })}
            >
              Data*
            </label>
          </span>
          {getFormErrorMessage("eventDate")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputTextarea
              id="content"
              name="content"
              maxLength={1000}
              value={formik.values.content}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("content") })}
              autoResize
            />
            <label
              htmlFor="content"
              className={classNames({ "p-error": isFormFieldValid("content") })}
            >
              Treść*
            </label>
          </span>
          {getFormErrorMessage("content")}
        </div>
        <div className="field mb-5">
          <label htmlFor="rate" className={classNames({ "p-error": isFormFieldValid("rate") })}>
            Ocena*
          </label>
          <Rating
            id="rate"
            value={formik.values.rate}
            onChange={(event) => formik.setFieldValue("rate", event.value)}
          />
          {getFormErrorMessage("rate")}
        </div>

        <Button type="submit" label="Potwierdź" className="mt-2" loading={creatingReview} />
      </form>
    </Dialog>
  )
}

export default CreateReviewDialog
