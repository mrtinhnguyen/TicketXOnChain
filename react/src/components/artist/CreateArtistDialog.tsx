import { useState, useEffect, useRef, useCallback } from "react"
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
import type { Paths } from "~/utils/types/openapi.d.ts"
import client from "~/utils/client"
import { Editor } from "primereact/editor"
import { FileUpload } from "primereact/fileupload"
import { Image } from "primereact/image"

const header = (
  <>
    <span className="ql-formats">
      <select className="ql-header">
        <option value="0">Treść</option>
        <option value="2">Podtytuł</option>
        <option value="1">Tytuł</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-bold" aria-label="Pogrubienie"></button>
      <button className="ql-italic" aria-label="Italic"></button>
      <button className="ql-underline" aria-label="Podkreślenie"></button>
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered" aria-label="Lista uporządkowana"></button>
      <button className="ql-list" value="bullet" aria-label="Lista nieuporządkowana"></button>
    </span>
    <span className="ql-formats">
      <button className="ql-link" aria-label="Link"></button>
      <button className="ql-clean" aria-label="Wyczyść"></button>
    </span>
  </>
)

const createUserSchema = Yup.object().shape({
  name: Yup.string().trim().max(85).required("Nazwa jest wymagana"),
  description: Yup.string().trim().max(3000).required("Opis jest wymagany"),
  picture: Yup.mixed()
    .required("Zdjęcie jest wymagane")
    .test(
      "fileType",
      "Nieprawidłowy typ pliku",
      (file: any) =>
        file === undefined ||
        ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
    .test(
      "fileSize",
      "Plik jest zbyt duży",
      (file: any) => file === undefined || file.size <= 1024 * 1024 * 2 // 2MB
    ),
})

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface IToastProp {
  toast: RefObject<Toast>
}

type CreateArtistRequest = Omit<Paths.CreateArtist.RequestBody, "pictureIdUpload"> & {
  pictureIdUpload: number | undefined
  picture: any
}

type Props = IRevalidateProp & IToastProp & DialogProps

function CreateArtistDialog({ revalidate, toast, visible, onHide, ...props }: Readonly<Props>) {
  const [creatingArtist, setCreatingArtist] = useState(false)

  useEffect(() => {
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleCreateArtist = useCallback(async (data: CreateArtistRequest) => {
    try {
      setCreatingArtist(true)

      let pictureIdUpload = data.pictureIdUpload
      if (pictureIdUpload === null) {
        const upload = new FormData()

        upload.set("file", data.picture)
        upload.set("type", "IMAGE")

        const result = await client.CreateUpload(undefined, upload as any)

        pictureIdUpload = result.data.idUpload
        formik.setFieldValue("pictureIdUpload", pictureIdUpload)
      }

      await client.CreateArtist(undefined, {
        pictureIdUpload: pictureIdUpload!,
        name: data.name,
        description: data.description,
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
      await revalidate()
      setCreatingArtist(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formik = useFormik<CreateArtistRequest>({
    initialValues: {
      name: "",
      description: "",
      pictureIdUpload: undefined,
      picture: undefined,
    },
    validationSchema: createUserSchema,
    onSubmit: handleCreateArtist,
  })

  const isFormFieldValid = (name: keyof CreateArtistRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof CreateArtistRequest) => {
    return (
      isFormFieldValid(name) && <small className="p-error">{formik.errors[name] as string}</small>
    )
  }

  const [picturePreview, setPicturePreview] = useState<string>("")

  useEffect(() => {
    if (formik.values.picture) {
      const fileReader = new FileReader()
      fileReader.onload = (event: any) => {
        setPicturePreview(event.target.result)
      }
      fileReader.readAsDataURL(formik.values.picture)
    } else {
      setPicturePreview("")
    }
  }, [formik.values.picture])

  const pictureRef = useRef<any>()

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <form onSubmit={formik.handleSubmit} className="p-fluid pt-4">
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="name"
              name="name"
              maxLength={85}
              value={formik.values.name}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("name") })}
            />
            <label htmlFor="name" className={classNames({ "p-error": isFormFieldValid("name") })}>
              Nazwa*
            </label>
          </span>
          {getFormErrorMessage("name")}
        </div>
        <div className="field mb-5">
          <label
            htmlFor="description"
            className={classNames({ "p-error": isFormFieldValid("description") })}
          >
            Opis*
          </label>
          <Editor
            id="description"
            name="description"
            maxLength={3000}
            value={formik.values.description}
            onTextChange={(event) => formik.setFieldValue("description", event.htmlValue)}
            headerTemplate={header}
            className={classNames({ "p-invalid": isFormFieldValid("description") })}
            style={{
              height: "320px",
            }}
          />
          {getFormErrorMessage("description")}
        </div>
        <div className="field mb-5">
          <label
            htmlFor="picture"
            className={classNames({ "p-error": isFormFieldValid("picture") })}
          >
            Zdjęcie*
          </label>
          <FileUpload
            ref={pictureRef}
            id="picture"
            name="picture"
            accept="image/avif, image/gif, image/jpeg, image/png, image/webp"
            onSelect={(event) => {
              formik.setFieldValue("pictureIdUpload", null)
              formik.setFieldValue("picture", event.files[0])
            }}
            mode="basic"
            auto
            chooseLabel={formik.values.picture?.name ?? "Wybierz"}
            customUpload
            uploadHandler={() => {
              pictureRef.current.clear()
            }}
          />
          <p>
            <small id="picture-help">Plik avif, gif, jpeg, png or webp do 2 MB</small>
          </p>
          {getFormErrorMessage("picture")}
          <div>
            <Image
              loading="lazy"
              src={picturePreview}
              alt="Artysta"
              imageStyle={{
                width: "100%",
                maxWidth: "250px",
              }}
            />
          </div>
        </div>

        <Button type="submit" label="Potwierdź" className="mt-2" loading={creatingArtist} />
      </form>
    </Dialog>
  )
}

export default CreateArtistDialog
