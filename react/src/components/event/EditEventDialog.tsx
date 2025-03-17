import { useState, useEffect, useCallback, useRef } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputNumber } from "primereact/inputnumber"
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar"
import { Checkbox } from "primereact/checkbox"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { ProgressSpinner } from "primereact/progressspinner"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useMetaMask } from "~/hooks/useMetaMask"
import Ticket from "~/utils/ticket"
import type { Components, Paths } from "~/utils/types/openapi.d.ts"
import type { AxiosError } from "axios"
import axios from "axios"
import client from "~/utils/client"
import type { SelectItemOptionsType } from "primereact/selectitem"
import { ToggleButton } from "primereact/togglebutton"
import { InputText } from "primereact/inputtext"
import { Editor } from "primereact/editor"
import { FileUpload } from "primereact/fileupload"
import { Image } from "primereact/image"
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

const editEventSchema = Yup.object().shape({
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
  tags: Yup.string().trim().max(100).required("Tagi są wymagane"),
  description: Yup.string().trim().max(3000).required("Opis jest wymagany"),
  video: Yup.string().trim().url("Nieprawidłowy adres URL").max(255),
  location: Yup.string().trim().max(120).required("Lokalizacja jest wymagana"),
  street: Yup.string().trim().max(85).required("Ulica jest wymagana"),
  postalCode: Yup.string()
    .trim()
    .matches(/^\d{2}-\d{3}$/, "Nieprawidłowy format kodu pocztowego")
    .required("Kod pocztowy jest wymagany"),
  start: Yup.date().required("Data rozpoczęcia jest wymagana"),
  draft: Yup.boolean().required("Szkic jest wymagany"),
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
    .min(0)
    .max(5, "Maksymalnie 5 plików"),
  artists: Yup.array()
    .of(Yup.number().integer())
    .min(1, "Artyści są wymagani")
    .max(5, "Maksymalnie 5 artystów"),
})

const editEventBlockchainSchema = Yup.object().shape({
  maxSupply: Yup.number().integer().min(1).required("Liczba biletów jest wymagana"),
  price: Yup.number().min(0).max(9999999999.999).required("Cena jest wymagana"),
  maxTokensPerWallet: Yup.number()
    .integer()
    .min(1)
    .required("Maksymalna liczba biletów dla portfela jest wymagana"),
  publish: Yup.date().required("Data publikacji jest wymagana"),
  transferable: Yup.boolean().required("Zbywalność jest wymagana"),
})

interface IEditEvent {
  maxSupply: number
  price: number
  maxTokensPerWallet: number
  publish: string
  transferable: boolean
}

interface IEventProp {
  idEvent: number | null
}

interface IToastProp {
  toast: RefObject<Toast>
}

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

type UpdateEventRequest = Omit<Paths.UpdateEvent.RequestBody, "idSubcategory"> & {
  idSubcategory: number | undefined
  statute: any
  nftImage: any
  imagesIdUpload: any[]
}

type Props = IEventProp & IToastProp & IRevalidateProp & DialogProps

function EditEventDialog({
  revalidate,
  toast,
  idEvent,
  visible,
  onHide,
  ...props
}: Readonly<Props>) {
  const { wallet } = useMetaMask()

  const [selectedSubcategory, setSelectedSubcategory] = useState<
    { idSubcategory: number; name: string } | undefined
  >()
  const [selectedArtists, setSelectedArtists] = useState<{ idArtist: number; name: string }[]>([])

  const [categories, setCategories] = useState<SelectItemOptionsType | undefined>(undefined)
  const [cities, setCities] = useState<Components.Schemas.ListCities | null>(null)
  const [artistsFilter, setArtistsFilter] = useState<SelectItemOptionsType | undefined>(undefined)

  const [blockchainMode, setBlockchainMode] = useState(false)

  const [event, setEvent] = useState<Components.Schemas.GetEvent | null>(null)

  const [paused, setPaused] = useState<boolean | null>(null)
  const [updatingEvent, setUpdatingEvent] = useState(false)
  const [pausing, setPausing] = useState(false)

  const handleGetEvent = useCallback(async () => {
    try {
      setEvent(null)
      const result = await client.GetEvent({
        id: idEvent!,
      })
      setEvent(result.data)
    } catch (error: any) {
      console.error(error)
      if (axios.isAxiosError(error)) {
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: (error as AxiosError<{ message?: string }>).response?.data.message,
        })
      }
      onHide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEvent])

  const getPaused = useCallback(async () => {
    if (window.web3 !== undefined && wallet.accounts.length > 0) {
      const contract = new window.web3.eth.Contract(Ticket, event!.contractAddress!)
      contract.handleRevert = true

      const pausedMethod = contract.methods.paused()
      try {
        const paused = await pausedMethod.call()
        setPaused(paused)
      } catch (error: any) {
        console.error(error)
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: error.data?.message || error.message,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, event])

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
    setBlockchainMode(false)
    if (visible) {
      formik.resetForm()
      formikBlockchain.resetForm()
      setPaused(null)
      setEvent(null)
      handleGetEvent()
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

  const handleEditEvent = useCallback(
    async (data: UpdateEventRequest) => {
      try {
        setUpdatingEvent(true)

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

        await client.UpdateEvent(
          {
            id: idEvent!,
          },
          {
            idSubcategory: data.idSubcategory!,
            cityName: data.cityName,
            statuteIdUpload,
            nftImageIdUpload,
            tags: data.tags,
            description: data.description,
            video: data.video ? data.video : null,
            location: data.location,
            street: data.street,
            postalCode: data.postalCode,
            start: data.start,
            draft: data.draft,
            images: images as [
              (number | undefined)?,
              (number | undefined)?,
              (number | undefined)?,
              (number | undefined)?,
              (number | undefined)?
            ],
            artists: data.artists,
          }
        )

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
        setUpdatingEvent(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idEvent]
  )

  const handleEditEventBlockchain = useCallback(
    async (data: IEditEvent) => {
      if (window.web3 !== undefined && wallet.accounts.length > 0) {
        const contract = new window.web3.eth.Contract(Ticket, event!.contractAddress!)
        contract.handleRevert = true

        const modifyTicketMethod = contract.methods.modifyTicket(
          data.maxSupply,
          data.price * 1000000000000000000,
          data.maxTokensPerWallet,
          Math.floor(new Date(data.publish).getTime() / 1000),
          data.transferable
        )
        try {
          setUpdatingEvent(true)
          await modifyTicketMethod.call({
            from: wallet.accounts[0],
          })
          await modifyTicketMethod.send({
            from: wallet.accounts[0],
          })

          formikBlockchain.resetForm()
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
          setUpdatingEvent(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet, event]
  )

  const formik = useFormik<UpdateEventRequest>({
    initialValues: {
      idSubcategory: undefined,
      cityName: "",
      statuteIdUpload: null,
      statute: undefined,
      nftImageIdUpload: null,
      nftImage: undefined,
      tags: "",
      description: "",
      video: "",
      location: "",
      street: "",
      postalCode: "",
      start: new Date().toISOString(),
      draft: true,
      imagesIdUpload: [],
      images: [],
      artists: [],
    },
    validationSchema: editEventSchema,
    onSubmit: handleEditEvent,
  })

  const isFormFieldValid = (name: keyof UpdateEventRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof UpdateEventRequest) => {
    return (
      isFormFieldValid(name) && <small className="p-error">{formik.errors[name] as string}</small>
    )
  }

  const formikBlockchain = useFormik<IEditEvent>({
    initialValues: {
      maxSupply: 1,
      price: 0,
      maxTokensPerWallet: 1,
      publish: new Date().toISOString(),
      transferable: false,
    },
    validationSchema: editEventBlockchainSchema,
    onSubmit: handleEditEventBlockchain,
  })

  const isFormFieldValidBlockchain = (name: keyof IEditEvent) =>
    !!(formikBlockchain.touched[name] && formikBlockchain.errors[name])
  const getFormErrorMessageBlockchain = (name: keyof IEditEvent) => {
    return (
      isFormFieldValidBlockchain(name) && (
        <small className="p-error">{formikBlockchain.errors[name]}</small>
      )
    )
  }

  useEffect(() => {
    if (visible) {
      if (event) {
        formik.setValues({
          idSubcategory: event.idSubcategory,
          cityName: event.cityName,
          statuteIdUpload: event.statuteIdUpload,
          statute: undefined,
          nftImageIdUpload: event.nftImageIdUpload!,
          nftImage: undefined,
          tags: event.tags!,
          description: event.description,
          video: event.video ?? "",
          location: event.location,
          street: event.street,
          postalCode: event.postalCode,
          start: event.start,
          draft: !!event.draft!,
          imagesIdUpload: event.images.map((image) => image.idUpload),
          images: [],
          artists: event.artists.map((artist) => artist.idArtist) as [
            (number | undefined)?,
            (number | undefined)?,
            (number | undefined)?,
            (number | undefined)?,
            (number | undefined)?
          ],
        })
        setSelectedSubcategory({
          idSubcategory: event.idSubcategory,
          name: event.subcategoryName,
        })
        setSelectedArtists(
          event.artists.map((artist) => ({
            idArtist: artist.idArtist,
            name: artist.name,
          }))
        )
        formikBlockchain.setValues({
          maxSupply: event.ticketCount!,
          price: Number(event.ticketPrice!) / 1000000000000000000,
          maxTokensPerWallet: event.maxTicketsPerUser!,
          publish: new Date(event.publish!).toISOString(),
          transferable: !!event.transferable,
        })

        if (event.contractAddress) {
          getPaused()
        }
      } else {
        formik.resetForm()
        formikBlockchain.resetForm()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, event])

  const [nftImagePreview, setNftImagePreview] = useState<string>("")

  useEffect(() => {
    if (formik.values.nftImage) {
      const fileReader = new FileReader()
      fileReader.onload = (event: any) => {
        setNftImagePreview(event.target.result)
      }
      fileReader.readAsDataURL(formik.values.nftImage)
    } else if (event) {
      setNftImagePreview(event.nftImageUrl ?? "")
    } else {
      setNftImagePreview("")
    }
  }, [formik.values.nftImage, event])

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
    } else if (event) {
      setImagesPreview(event.images.map((image) => image.url))
    } else {
      setImagesPreview([])
    }
  }, [formik.values.images, event])

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

  const handlePause = useCallback(async () => {
    if (window.web3 !== undefined && wallet.accounts.length > 0) {
      const contract = new window.web3.eth.Contract(Ticket, event!.contractAddress!)
      contract.handleRevert = true

      let method
      if (paused === true) {
        method = contract.methods.unpause()
      } else {
        method = contract.methods.pause()
      }
      try {
        setPausing(true)
        await method.call({
          from: wallet.accounts[0],
        })
        await method.send({
          from: wallet.accounts[0],
        })

        getPaused()
      } catch (error: any) {
        console.error(error)
        toast.current?.show({
          severity: "error",
          summary: "Komunikat o błędzie",
          detail: error.data?.message || error.message,
        })
      } finally {
        setPausing(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, event, paused])

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      {event?.contractAddress && (
        <ToggleButton
          onLabel="Tryb łańcucha bloków"
          offLabel="Tryb normalny"
          checked={blockchainMode}
          className="p-button-sm mb-3"
          onChange={(e) => setBlockchainMode(e.value)}
          disabled={wallet.accounts.length === 0}
        />
      )}
      {blockchainMode ? (
        <div>
          {paused !== null ? (
            <Button
              label={paused ? "Wznów" : "Wstrzymaj"}
              size="small"
              severity={paused ? "info" : "warning"}
              className="mb-3"
              loading={pausing}
              onClick={handlePause}
            />
          ) : (
            <ProgressSpinner style={{ width: "32px", height: "32px" }} />
          )}
          <form onSubmit={formikBlockchain.handleSubmit} className="p-fluid pt-4">
            <div className="field mb-5">
              <span className="p-float-label">
                <InputNumber
                  id="maxSupply"
                  name="maxSupply"
                  min={0}
                  value={Number(formikBlockchain.values.maxSupply)}
                  onValueChange={formikBlockchain.handleChange}
                  className={classNames({ "p-invalid": isFormFieldValidBlockchain("maxSupply") })}
                  useGrouping={false}
                />
                <label
                  htmlFor="maxSupply"
                  className={classNames({ "p-error": isFormFieldValidBlockchain("maxSupply") })}
                >
                  Liczba biletów*
                </label>
              </span>
              {getFormErrorMessageBlockchain("maxSupply")}
            </div>
            <div className="field mb-5">
              <div className="p-inputgroup flex-1">
                <span className="p-float-label">
                  <InputNumber
                    id="price"
                    name="price"
                    min={0}
                    max={9999999999.999}
                    maxFractionDigits={3}
                    value={Number(formikBlockchain.values.price)}
                    onValueChange={formikBlockchain.handleChange}
                    className={classNames({ "p-invalid": isFormFieldValidBlockchain("price") })}
                    inputClassName="border-noround-right w-full"
                    useGrouping={false}
                  />
                  <label
                    htmlFor="price"
                    className={classNames({ "p-error": isFormFieldValidBlockchain("price") })}
                  >
                    Cena*
                  </label>
                </span>
                <span className="p-inputgroup-addon">ETH</span>
              </div>
              {getFormErrorMessageBlockchain("price")}
            </div>
            <div className="field mb-5">
              <span className="p-float-label">
                <InputNumber
                  id="maxTokensPerWallet"
                  name="maxTokensPerWallet"
                  min={0}
                  value={Number(formikBlockchain.values.maxTokensPerWallet)}
                  onValueChange={formikBlockchain.handleChange}
                  className={classNames({
                    "p-invalid": isFormFieldValidBlockchain("maxTokensPerWallet"),
                  })}
                  useGrouping={false}
                />
                <label
                  htmlFor="maxTokensPerWallet"
                  className={classNames({
                    "p-error": isFormFieldValidBlockchain("maxTokensPerWallet"),
                  })}
                >
                  Maksymalna liczba biletów dla portfela*
                </label>
              </span>
              {getFormErrorMessageBlockchain("maxTokensPerWallet")}
            </div>
            <div className="field mb-5">
              <span className="p-float-label">
                <Calendar
                  id="publish"
                  name="publish"
                  value={new Date(formikBlockchain.values.publish)}
                  onChange={formikBlockchain.handleChange}
                  className={classNames({ "p-invalid": isFormFieldValidBlockchain("publish") })}
                  dateFormat="dd.mm.yy"
                  showTime
                  showSeconds
                  hourFormat="24"
                />
                <label
                  htmlFor="publish"
                  className={classNames({ "p-error": isFormFieldValidBlockchain("publish") })}
                >
                  Publikacja*
                </label>
              </span>
              {getFormErrorMessageBlockchain("publish")}
            </div>
            <div className="field-checkbox">
              <Checkbox
                inputId="transferable"
                name="transferable"
                checked={formikBlockchain.values.transferable}
                onChange={formikBlockchain.handleChange}
                className={classNames({ "p-invalid": isFormFieldValidBlockchain("transferable") })}
              />
              <label
                htmlFor="transferable"
                className={classNames({ "p-error": isFormFieldValidBlockchain("transferable") })}
              >
                Zbywalność*
              </label>
            </div>

            <Button
              type="submit"
              label="Potwierdź"
              className="mt-2"
              loading={updatingEvent}
              disabled={event === null}
            />
          </form>
        </div>
      ) : (
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
            {event?.statuteUrl && !formik.values.statute && (
              <a href={event.statuteUrl} rel="noreferrer" target="_blank">
                Podgląd statutu
              </a>
            )}
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
            <label htmlFor="name">Nazwa*</label>
            <InputText id="name" value={event?.name ?? ""} disabled />
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
            {formik.values.description && (
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
            )}
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
              <label
                htmlFor="video"
                className={classNames({ "p-error": isFormFieldValid("video") })}
              >
                Wideo
              </label>
            </span>
            <p>
              <small id="video-help">Link do filmu Youtube lub Vimeo</small>
            </p>
            {getFormErrorMessage("video")}
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
            {formik.values.postalCode && (
              <InputMask
                id="postalCode"
                name="postalCode"
                value={formik.values.postalCode}
                onChange={formik.handleChange}
                mask="99-999"
                className={classNames({ "p-invalid": isFormFieldValid("postalCode") })}
                placeholder="Wprowadź kod pocztowy"
              />
            )}
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
              <label
                htmlFor="start"
                className={classNames({ "p-error": isFormFieldValid("start") })}
              >
                Rozpoczęcie*
              </label>
            </span>
            {getFormErrorMessage("start")}
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
          <div className="field mb-5">
            <label
              htmlFor="images"
              className={classNames({ "p-error": isFormFieldValid("images") })}
            >
              Zdjęcia
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
                imagesRef.current!.clear()
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
                  alt={event?.name ?? "Wydarzenie"}
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

          <Button
            type="submit"
            label="Potwierdź"
            className="mt-2"
            loading={updatingEvent}
            disabled={event === null}
          />
        </form>
      )}
    </Dialog>
  )
}

export default EditEventDialog
