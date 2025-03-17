import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { Button } from "primereact/button"
import { Dialog, DialogProps } from "primereact/dialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import type { Paths } from "~/utils/types/openapi.d.ts"
import client from "~/utils/client"
import { Dropdown } from "primereact/dropdown"

const updateUserRoleSchema = Yup.object().shape({
  role: Yup.string()
    .oneOf(["USER", "EVENTS_ORGANIZER", "ADMINISTRATOR"])
    .required("Rola jest wymagana"),
})

interface IRevalidateProp {
  revalidate: () => Promise<void>
}

interface IToastProp {
  toast: RefObject<Toast>
}

interface IUserProp {
  user: any
}

type UpdateUserRoleRequest = Paths.UpdateUserRole.RequestBody

type Props = IRevalidateProp & IToastProp & IUserProp & DialogProps

function EditUserRoleDialog({
  revalidate,
  toast,
  user,
  visible,
  onHide,
  ...props
}: Readonly<Props>) {
  const [updatingUserRole, setUpdatingUserRole] = useState(false)

  useEffect(() => {
    if (visible) {
      formik.resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleUpdateUserRole = useCallback(
    async (data: UpdateUserRoleRequest) => {
      try {
        setUpdatingUserRole(true)
        await client.UpdateUserRole(user?.idUser, {
          role: data.role,
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
        setUpdatingUserRole(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  )

  const formik = useFormik<UpdateUserRoleRequest>({
    initialValues: {
      role: "USER",
    },
    validationSchema: updateUserRoleSchema,
    onSubmit: handleUpdateUserRole,
  })

  const isFormFieldValid = (name: keyof UpdateUserRoleRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof UpdateUserRoleRequest) => {
    return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>
  }

  useEffect(() => {
    if (visible && user) {
      formik.setValues({
        role: user.role,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user])

  return (
    <Dialog visible={visible} onHide={onHide} {...props}>
      <form onSubmit={formik.handleSubmit} className="p-fluid pt-4">
        <div className="field mb-5">
          <span className="p-float-label">
            <Dropdown
              id="role"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              options={[
                { label: "Użytkownik", value: "USER" },
                { label: "Organizator wydarzeń", value: "EVENTS_ORGANIZER" },
                { label: "Administrator", value: "ADMINISTRATOR" },
              ]}
            />
            <label htmlFor="role">Rola*</label>
          </span>
          {getFormErrorMessage("role")}
        </div>

        <Button type="submit" label="Potwierdź" className="mt-2" loading={updatingUserRole} />
      </form>
    </Dialog>
  )
}

export default EditUserRoleDialog
