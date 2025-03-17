import { useState, useEffect, useRef, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputText } from "primereact/inputtext"
import { InputNumber } from "primereact/inputnumber"
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar"
import { Checkbox } from "primereact/checkbox"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import type { Components, Paths } from "~/utils/types/openapi.d.ts"
import client from "~/utils/client"
import { Editor } from "primereact/editor"
import { FileUpload } from "primereact/fileupload"
import { Image } from "primereact/image"
import type { SelectItemOptionsType } from "primereact/selectitem"
import { Dropdown } from "primereact/dropdown"
import { AutoComplete } from "primereact/autocomplete"
import { Chips } from "primereact/chips"
import { MultiSelect } from "primereact/multiselect"
import { InputMask } from "primereact/inputmask"

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

function groupedItemTemplate(option: any) {
  return (
    <div className="flex align-items-center">
      <div>{option.optionGroup.name}</div>
    </div>
  )
}

const createEventSchema = Yup.object().shape({
  idSubcategory: Yup.number().integer().required("Podkategoria jest wymagana"),
  cityName: Yup.string().trim().max(85).required("Miasto jest wymagane"),
  statute: Yup.mixed()
    .test(
      "fileType",
      "Nieprawidłowy typ pliku",
      (file: any) => file === undefined || ["application/pdf"].includes(file.type)
    )
    .test(
      "fileSize",
      "Plik jest zbyt duży",
      (file: any) => file === undefined || file.size <= 1024 * 1024 * 2 // 2MB
    ),
  nftImage: Yup.mixed()
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
  name: Yup.string().trim().max(120).required("Nazwa jest wymagana"),
  tags: Yup.string().trim().max(100).required("Tagi są wymagane"),
  description: Yup.string().trim().max(3000).required("Opis jest wymagany"),
  video: Yup.string().trim().url("Nieprawidłowy adres URL").max(255),
  ticketPrice: Yup.number().min(0).max(9999999999.999).required("Cena jest wymagana"),
  ticketCount: Yup.number().integer().min(1).required("Liczba biletów jest wymagana"),
  maxTicketsPerUser: Yup.number()
    .integer()
    .min(1)
    .required("Maksymalna liczba biletów dla użytkownika jest wymagana"),
  location: Yup.string().trim().max(120).required("Lokalizacja jest wymagana"),
  street: Yup.string().trim().max(85).required("Ulica jest wymagana"),
  postalCode: Yup.string()
    .trim()
    .matches(/^\d{2}-\d{3}$/, "Nieprawidłowy format kodu pocztowego")
    .required("Kod pocztowy jest wymagany"),
  start: Yup.date().required("Data rozpoczęcia jest wymagana"),
  publish: Yup.date().required("Data publikacji jest wymagana"),
  draft: Yup.boolean().required("Szkic jest wymagany"),
  transferable: Yup.boolean().required("Zbywalność jest wymagana"),
  images: Yup.array()
    .of(
      Yup.mixed()
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
        )
    )
    .min(1, "Zdjęcia są wymagane")
    .max(5, "Maksymalnie 5 plików"),
  artists: Yup.array()
    .of(Yup.number().integer())
    .min(1, "Artyści są wymagani")
    .max(5, "Maksymalnie 5 artystów"),
  imagesIdUpload: Yup.array().of(Yup.mixed()),
})

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface IToastProp {
  toast: RefObject<Toast>
}

type CreateEventRequest = Omit<Paths.CreateEvent.RequestBody, "idSubcategory"> & {
  idSubcategory: number | undefined
  statute: any
  nftImage: any
  imagesIdUpload: any[]
}

type Props = IRevalidateProp & IToastProp & DialogProps

function CreateEventDialog({ revalidate, toast, visible, onHide, ...props }: Readonly<Props>) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    { idSubcategory: number; name: string } | undefined
  >()
  const [selectedArtists, setSelectedArtists] = useState<{ idArtist: number; name: string }[]>([])

  const [categories, setCategories] = useState<SelectItemOptionsType | undefined>(undefined)
  const [cities, setCities] = useState<Components.Schemas.ListCities | null>(null)
  const [artistsFilter, setArtistsFilter] = useState<SelectItemOptionsType | undefined>(undefined)

  const [creatingEvent, setCreatingEvent] = useState(false)

  const handleListCategories = async () => {
    setCategories(undefined)
    const result = await client.ListCategories()
    setCategories(result.data)
  }

  const handleListCities = async () => {
    setCities(null)
    const result = await client.ListCities()
    setCities(result.data)
  }

  const handleListArtistsFilter = async () => {
    setArtistsFilter(undefined)
    const result = await client.get("/artists/filter")
    setArtistsFilter(result.data)
  }

  useEffect(() => {
    if (visible) {
      formik.resetForm()
      setSelectedSubcategory(undefined)
      setSelectedArtists([])
      setCategories(undefined)
      setCities(null)
      setArtistsFilter(undefined)
      handleListCategories()
      handleListCities()
      handleListArtistsFilter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleCreateEvent = useCallback(async (data: CreateEventRequest) => {
    try {
      setCreatingEvent(true)

      let statuteIdUpload = data.statuteIdUpload
      if (statuteIdUpload === null && data.statute) {
        const statuteUpload = new FormData()

        statuteUpload.set("file", data.statute)
        statuteUpload.set("type", "FILE")

        const statuteResult = await client.CreateUpload(undefined, statuteUpload as any)

        statuteIdUpload = statuteResult.data.idUpload
        formik.setFieldValue("statuteIdUpload", statuteIdUpload)
      }

      let nftImageIdUpload = data.nftImageIdUpload
      if (nftImageIdUpload === null && data.nftImage) {
        const nftImageUpload = new FormData()

        nftImageUpload.set("file", data.nftImage)
        nftImageUpload.set("type", "IMAGE")

        const nftImageResult = await client.CreateUpload(undefined, nftImageUpload as any)

        nftImageIdUpload = nftImageResult.data.idUpload
        formik.setFieldValue("nftImageIdUpload", nftImageIdUpload)
      }

      const images: number[] = [...data.imagesIdUpload]
      if (images.length === 0) {
        for (const image of data.images as any[]) {
          const imageUpload = new FormData()

          imageUpload.set("file", image)
          imageUpload.set("type", "IMAGE")

          const imageResult = await client.CreateUpload(undefined, imageUpload as any)

          images.push(imageResult.data.idUpload)
        }
        formik.setFieldValue("imagesIdUpload", images)
      }

      await client.CreateEvent(undefined, {
        idSubcategory: data.idSubcategory!,
        cityName: data.cityName,
        statuteIdUpload,
        nftImageIdUpload,
        name: data.name,
        tags: data.tags,
        description: data.description,
        video: data.video ? data.video : null,
        ticketPrice: (Number(data.ticketPrice) * 1000000000000000000).toString(),
        ticketCount: data.ticketCount,
        maxTicketsPerUser: data.maxTicketsPerUser,
        location: data.location,
        street: data.street,
        postalCode: data.postalCode,
        start: data.start,
        publish: data.publish,
        draft: data.draft,
        transferable: data.transferable,
        images: images as [
          (number | undefined)?,
          (number | undefined)?,
          (number | undefined)?,
          (number | undefined)?,
          (number | undefined)?
        ],
        artists: data.artists,
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
      setCreatingEvent(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formik = useFormik<CreateEventRequest>({
    initialValues: {
      idSubcategory: undefined,
      cityName: "",
      statuteIdUpload: null,
      statute: undefined,
      nftImageIdUpload: null,
      nftImage: undefined,
      name: "",
      tags: "",
      description: "",
      video: "",
      ticketPrice: "0",
      ticketCount: 1,
      maxTicketsPerUser: 1,
      location: "",
      street: "",
      postalCode: "",
      start: new Date().toISOString(),
      publish: new Date().toISOString(),
      draft: true,
      transferable: false,
      imagesIdUpload: [],
      images: [],
      artists: [],
    },
    validationSchema: createEventSchema,
    onSubmit: handleCreateEvent,
  })

  const isFormFieldValid = (name: keyof CreateEventRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof CreateEventRequest) => {
    return (
      isFormFieldValid(name) && <small className="p-error">{formik.errors[name] as string}</small>
    )
  }

  const [nftImagePreview, setNftImagePreview] = useState<string>("")

  useEffect(() => {
    if (formik.values.nftImage) {
      const fileReader = new FileReader()
      fileReader.onload = (event: any) => {
        setNftImagePreview(event.target.result)
      }
      fileReader.readAsDataURL(formik.values.nftImage)
    } else {
      setNftImagePreview("")
    }
  }, [formik.values.nftImage])

  const [imagesPreview, setImagesPreview] = useState<string[]>([])

  useEffect(() => {
    if (formik.values.images.length > 0) {
      const images: string[] = []
      let counter = 0
      for (const image of formik.values.images) {
        if (counter >= 5) {
          break
        }
        const fileReader = new FileReader()
        fileReader.onload = (event: any) => {
          images.push(event.target.result)
          setImagesPreview([...images])
        }
        fileReader.readAsDataURL(image as unknown as Blob)
        ++counter
      }

      setImagesPreview([...images])
    } else {
      setImagesPreview([])
    }
  }, [formik.values.images])

  const [items, setItems] = useState<string[]>([])

  const search = useCallback(
    (event: any) => {
      if (cities) {
        if (event.query) {
          const query = event.query.trim().toLowerCase()
          setItems(
            cities
              .filter((city) => city.name.toLowerCase().indexOf(query) !== -1)
              .map((city) => city.name)
          )
        } else {
          setItems(cities.map((city) => city.name))
        }
      }
    },
    [cities]
  )

  const statuteRef = useRef<any>()
  const nftImageRef = useRef<any>()
  const imagesRef = useRef<any>()

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <form onSubmit={formik.handleSubmit} className="p-fluid pt-4">
        <div className="field mb-5">
          <label
            htmlFor="idSubcategory"
            className={classNames({ "p-error": isFormFieldValid("idSubcategory") })}
          >
            Podkategoria*
          </label>
          <Dropdown
            id="idSubcategory"
            name="idSubcategory"
            value={selectedSubcategory}
            onChange={(e) => {
              setSelectedSubcategory(e.value)
              formik.setFieldValue("idSubcategory", e.value.idSubcategory)
            }}
            options={categories}
            optionLabel="name"
            optionGroupLabel="name"
            optionGroupChildren="subcategories"
            optionGroupTemplate={groupedItemTemplate}
            placeholder="Wybierz podkategorię"
            className={classNames({ "p-invalid": isFormFieldValid("idSubcategory") })}
            showClear
            scrollHeight="500px"
          />
          {getFormErrorMessage("idSubcategory")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <AutoComplete
              id="cityName"
              name="cityName"
              value={formik.values.cityName}
              suggestions={items}
              completeMethod={search}
              onChange={(e) => formik.setFieldValue("cityName", e.value)}
              className={classNames({ "p-invalid": isFormFieldValid("cityName") })}
              dropdown
            />
            <label
              htmlFor="cityName"
              className={classNames({ "p-error": isFormFieldValid("cityName") })}
            >
              Miasto*
            </label>
          </span>
          {getFormErrorMessage("cityName")}
        </div>
        <div className="field mb-5">
          <label
            htmlFor="Statute"
            className={classNames({ "p-error": isFormFieldValid("statute") })}
          >
            Regulamin
          </label>
          <FileUpload
            ref={statuteRef}
            id="statute"
            name="statute"
            accept="application/pdf"
            onSelect={(event) => {
              formik.setFieldValue("statuteIdUpload", null)
              formik.setFieldValue("statute", event.files[0])
            }}
            mode="basic"
            auto
            chooseLabel={formik.values.statute?.name ?? "Wybierz"}
            customUpload
            uploadHandler={() => {
              statuteRef.current.clear()
            }}
          />
          <p>
            <small id="statute-help">Plik PDF do 2 MB</small>
          </p>
          {getFormErrorMessage("statute")}
        </div>
        <div className="field mb-5">
          <label
            htmlFor="nftImage"
            className={classNames({ "p-error": isFormFieldValid("nftImage") })}
          >
            Ilustracja NFT
          </label>
          <FileUpload
            ref={nftImageRef}
            id="nftImage"
            name="nftImage"
            accept="image/avif, image/gif, image/jpeg, image/png, image/webp"
            onSelect={(event) => {
              formik.setFieldValue("nftImageIdUpload", null)
              formik.setFieldValue("nftImage", event.files[0])
            }}
            mode="basic"
            auto
            chooseLabel={formik.values.nftImage?.name ?? "Wybierz"}
            customUpload
            uploadHandler={() => {
              nftImageRef.current.clear()
            }}
          />
          <p>
            <small id="nft-image-help">Plik avif, gif, jpeg, png or webp do 2 MB</small>
          </p>
          {getFormErrorMessage("nftImage")}
          <div>
            <Image
              loading="lazy"
              src={nftImagePreview}
              alt="Ilustracja NFT"
              imageStyle={{
                width: "100%",
                maxWidth: "250px",
              }}
            />
          </div>
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="name"
              name="name"
              maxLength={120}
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
          <span className="p-float-label">
            <Chips
              id="tags"
              name="tags"
              maxLength={100}
              value={formik.values.tags ? formik.values.tags.split(",") : []}
              onChange={(e) => formik.setFieldValue("tags", e.value?.join(","))}
              className={classNames({ "p-invalid": isFormFieldValid("tags") })}
            />
            <label htmlFor="tags" className={classNames({ "p-error": isFormFieldValid("tags") })}>
              Tagi*
            </label>
          </span>
          <p>
            <small id="tags-help">Wprowadź tag i wciśnij 'Enter'</small>
          </p>
          {getFormErrorMessage("tags")}
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
          <span className="p-float-label">
            <InputText
              id="video"
              name="video"
              maxLength={255}
              value={formik.values.video}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("video") })}
            />
            <label htmlFor="video" className={classNames({ "p-error": isFormFieldValid("video") })}>
              Wideo
            </label>
          </span>
          <p>
            <small id="video-help">Link do filmu Youtube lub Vimeo</small>
          </p>
          {getFormErrorMessage("video")}
        </div>
        <div className="field mb-5">
          <div className="p-inputgroup flex-1">
            <span className="p-float-label">
              <InputNumber
                id="ticketPrice"
                name="ticketPrice"
                min={0}
                max={9999999999.999}
                maxFractionDigits={3}
                value={Number(formik.values.ticketPrice)}
                onValueChange={formik.handleChange}
                className={classNames({ "p-invalid": isFormFieldValid("ticketPrice") })}
                inputClassName="border-noround-right w-full"
                useGrouping={false}
              />
              <label
                htmlFor="ticketPrice"
                className={classNames({ "p-error": isFormFieldValid("ticketPrice") })}
              >
                Cena*
              </label>
            </span>
            <span className="p-inputgroup-addon">ETH</span>
          </div>
          {getFormErrorMessage("ticketPrice")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputNumber
              id="ticketCount"
              name="ticketCount"
              min={0}
              value={Number(formik.values.ticketCount)}
              onValueChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("ticketCount") })}
              useGrouping={false}
            />
            <label
              htmlFor="ticketCount"
              className={classNames({ "p-error": isFormFieldValid("ticketCount") })}
            >
              Liczba biletów*
            </label>
          </span>
          {getFormErrorMessage("ticketCount")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputNumber
              id="maxTicketsPerUser"
              name="maxTicketsPerUser"
              min={0}
              value={Number(formik.values.maxTicketsPerUser)}
              onValueChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("maxTicketsPerUser") })}
              useGrouping={false}
            />
            <label
              htmlFor="maxTicketsPerUser"
              className={classNames({ "p-error": isFormFieldValid("maxTicketsPerUser") })}
            >
              Maksymalna liczba biletów dla użytkownika*
            </label>
          </span>
          {getFormErrorMessage("maxTicketsPerUser")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="location"
              name="location"
              maxLength={120}
              value={formik.values.location}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("location") })}
            />
            <label
              htmlFor="location"
              className={classNames({ "p-error": isFormFieldValid("location") })}
            >
              Lokalizacja*
            </label>
          </span>
          {getFormErrorMessage("location")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="street"
              name="street"
              maxLength={85}
              value={formik.values.street}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("street") })}
            />
            <label
              htmlFor="street"
              className={classNames({ "p-error": isFormFieldValid("street") })}
            >
              Ulica*
            </label>
          </span>
          {getFormErrorMessage("street")}
        </div>
        <div className="field mb-5">
          <label
            htmlFor="postalCode"
            className={classNames({ "p-error": isFormFieldValid("postalCode") })}
          >
            Kod pocztowy*
          </label>
          <InputMask
            id="postalCode"
            name="postalCode"
            value={formik.values.postalCode}
            onChange={formik.handleChange}
            mask="99-999"
            className={classNames({ "p-invalid": isFormFieldValid("postalCode") })}
            placeholder="Wprowadź kod pocztowy"
          />
          {getFormErrorMessage("postalCode")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <Calendar
              id="start"
              name="start"
              value={new Date(formik.values.start)}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("start") })}
              dateFormat="dd.mm.yy"
              showTime
              showSeconds
              hourFormat="24"
            />
            <label htmlFor="start" className={classNames({ "p-error": isFormFieldValid("start") })}>
              Rozpoczęcie*
            </label>
          </span>
          {getFormErrorMessage("start")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <Calendar
              id="publish"
              name="publish"
              value={new Date(formik.values.publish)}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("publish") })}
              dateFormat="dd.mm.yy"
              showTime
              showSeconds
              hourFormat="24"
            />
            <label
              htmlFor="publish"
              className={classNames({ "p-error": isFormFieldValid("publish") })}
            >
              Publikacja*
            </label>
          </span>
          {getFormErrorMessage("publish")}
        </div>
        <div className="field-checkbox">
          <Checkbox
            inputId="draft"
            name="draft"
            checked={formik.values.draft}
            onChange={formik.handleChange}
            className={classNames({ "p-invalid": isFormFieldValid("draft") })}
          />
          <label htmlFor="draft" className={classNames({ "p-error": isFormFieldValid("draft") })}>
            Szkic*
          </label>
        </div>
        <div className="field-checkbox">
          <Checkbox
            inputId="transferable"
            name="transferable"
            checked={formik.values.transferable}
            onChange={formik.handleChange}
            className={classNames({ "p-invalid": isFormFieldValid("transferable") })}
          />
          <label
            htmlFor="transferable"
            className={classNames({ "p-error": isFormFieldValid("transferable") })}
          >
            Zbywalność*
          </label>
        </div>
        <div className="field mb-5">
          <label htmlFor="images" className={classNames({ "p-error": isFormFieldValid("images") })}>
            Zdjęcia*
          </label>
          <FileUpload
            ref={imagesRef}
            id="images"
            name="images[]"
            accept="image/avif, image/gif, image/jpeg, image/png, image/webp"
            onSelect={(event) => {
              formik.setFieldValue("imagesIdUpload", [])
              formik.setFieldValue("images", event.files.slice(0, 5))
            }}
            mode="basic"
            auto
            chooseLabel={
              (formik.values.images.length > 0
                ? formik.values.images
                    .reduce(
                      (previousValue, currentValue: any) =>
                        previousValue + currentValue.name + ", ",
                      ""
                    )
                    .slice(0, -2)
                : null) ?? "Wybierz"
            }
            customUpload
            uploadHandler={() => {
              imagesRef.current.clear()
            }}
            multiple
          />
          <p>
            <small id="image-help">
              Pliki avif, gif, jpeg, png or webp do 2 MB, maksymalnie 5 plików
            </small>
          </p>
          {getFormErrorMessage("images")}
          <div>
            {imagesPreview.map((image, idx) => (
              <Image
                key={idx}
                loading="lazy"
                src={image}
                alt="Wydarzenie"
                imageStyle={{
                  width: "100%",
                  maxWidth: "250px",
                }}
                className="mr-2"
              />
            ))}
          </div>
        </div>
        <div className="field mb-5">
          <label
            htmlFor="artists"
            className={classNames({ "p-error": isFormFieldValid("artists") })}
          >
            Artyści*
          </label>
          <MultiSelect
            id="artists"
            name="artists"
            value={selectedArtists}
            onChange={(e) => {
              setSelectedArtists(e.value)
              formik.setFieldValue(
                "artists",
                e.value.map((artist: any) => artist.idArtist)
              )
            }}
            options={artistsFilter}
            optionLabel="name"
            placeholder="Wybierz artystów"
            className={classNames({ "p-invalid": isFormFieldValid("artists") })}
            selectionLimit={5}
            showSelectAll={false}
            showClear
            scrollHeight="500px"
          />
          {getFormErrorMessage("artists")}
        </div>

        <Button type="submit" label="Potwierdź" className="mt-2" loading={creatingEvent} />
      </form>
    </Dialog>
  )
}

export default CreateEventDialog
