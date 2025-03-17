import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { InputText } from "primereact/inputtext"
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar"
import { classNames } from "primereact/utils"
import { Dialog, DialogProps } from "primereact/dialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import type { Components, Paths } from "~/utils/types/openapi.d.ts"
import { formatDate } from "~/utils"
import client from "~/utils/client"

const updateUserSchema = Yup.object().shape({
  name: Yup.string().trim().max(85).required("Imię jest wymagane"),
  surname: Yup.string().trim().max(85).required("Nazwisko jest wymagane"),
  birthdate: Yup.date().required("Data urodzenia jest wymagana"),
})

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface IToastProp {
  toast: RefObject<Toast>
}

interface IUserProp {
  user: Components.Schemas.GetUser | null
}

type UpdateUserRequest = Paths.UpdateUser.RequestBody

type Props = IRevalidateProp & IToastProp & IUserProp & DialogProps

function EditUserDetailsDialog({
  revalidate,
  toast,
  user,
  visible,
  onHide,
  ...props
}: Readonly<Props>) {
  const [updatingUser, setUpdatingUser] = useState(false)

  useEffect(() => {
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleUpdateUser = useCallback(async (data: UpdateUserRequest) => {
    try {
      setUpdatingUser(true)
      await client.UpdateUser(undefined, {
        name: data.name,
        surname: data.surname,
        birthdate: formatDate(new Date(data.birthdate)),
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
      setUpdatingUser(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formik = useFormik<UpdateUserRequest>({
    initialValues: {
      name: "",
      surname: "",
      birthdate: new Date().toISOString(),
    },
    validationSchema: updateUserSchema,
    onSubmit: handleUpdateUser,
  })

  const isFormFieldValid = (name: keyof UpdateUserRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof UpdateUserRequest) => {
    return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>
  }

  useEffect(() => {
    if (visible && user) {
      formik.setValues({
        name: user.name,
        surname: user.surname,
        birthdate: user.birthdate,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user])

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
              Imię*
            </label>
          </span>
          {getFormErrorMessage("name")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <InputText
              id="surname"
              name="surname"
              maxLength={85}
              value={formik.values.surname}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("surname") })}
            />
            <label
              htmlFor="surname"
              className={classNames({ "p-error": isFormFieldValid("surname") })}
            >
              Nazwisko*
            </label>
          </span>
          {getFormErrorMessage("surname")}
        </div>
        <div className="field mb-5">
          <span className="p-float-label">
            <Calendar
              id="birthdate"
              name="birthdate"
              maxDate={new Date()}
              value={new Date(formik.values.birthdate)}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("birthdate") })}
              dateFormat="dd.mm.yy"
            />
            <label
              htmlFor="birthdate"
              className={classNames({ "p-error": isFormFieldValid("birthdate") })}
            >
              Data urodzenia*
            </label>
          </span>
          {getFormErrorMessage("birthdate")}
        </div>

        <p className="text-xs text-color-secondary">
          Wprowadzone tu dane pojawią się podczas weryfikowania biletu, upewnij się co do ich
          autentyczność
        </p>
        <Button type="submit" label="Potwierdź" className="mt-2" loading={updatingUser} />
      </form>
    </Dialog>
  )
}

export default EditUserDetailsDialog
