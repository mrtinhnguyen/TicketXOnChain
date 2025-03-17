import { useState, useCallback } from "react"
import type { RefObject } from "react"
import { InputText } from "primereact/inputtext"
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar"
import { Checkbox } from "primereact/checkbox"
import { Toast } from "primereact/toast"
import { classNames } from "primereact/utils"
import { useLocation, useNavigate, useOutletContext, Navigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import axios from "axios"
import type { AxiosError } from "axios"
import { formatDate } from "~/utils"
import { useMetaMask } from "~/hooks/useMetaMask"
import type { Paths } from "~/utils/types/openapi.d.ts"

const signUpSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Nieprawidłowy format adresu email")
    .max(320)
    .required("Adres email jest wymagany"),
  username: Yup.string().trim().max(85).required("Nazwa użytkownika jest wymagana"),
  name: Yup.string().trim().max(85).required("Imię jest wymagane"),
  surname: Yup.string().trim().max(85).required("Nazwisko jest wymagane"),
  birthdate: Yup.date().required("Data urodzenia jest wymagana"),
  accept: Yup.bool().oneOf([true], "Musisz wyrazić zgodę na przetwarzanie danych osobowych"),
})

type SignUpRequest = Paths.SignUp.RequestBody & { accept: boolean }

function SignUp() {
  const location = useLocation()
  const { token } = location.state || { token: null }
  const navigate = useNavigate()
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const { signedIn, signUp } = useMetaMask()

  const [signingUp, setSigningUp] = useState(false)

  const handleSignUp = useCallback((data: SignUpRequest) => {
    setSigningUp(true)
    signUp(
      {
        signUpToken: data.signUpToken,
        email: data.email,
        username: data.username,
        name: data.name,
        surname: data.surname,
        birthdate: formatDate(new Date(data.birthdate)),
      },
      () => {
        setSigningUp(false)
        formik.resetForm()
        toast.current?.show({
          severity: "success",
          summary: "Komunikat o powodzeniu",
          detail: "Sprawdź skrzynkę email w poszukiwaniu wiadomości aktywacyjnej",
        })
        navigate("/", { replace: true })
      },
      (error) => {
        setSigningUp(false)
        if (axios.isAxiosError(error)) {
          toast.current?.show({
            severity: "error",
            summary: "Komunikat o błędzie",
            detail: (error as AxiosError<{ message?: string }>).response?.data.message,
          })
          navigate("/", { replace: true })
        }
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formik = useFormik<SignUpRequest>({
    initialValues: {
      signUpToken: token,
      email: "",
      username: "",
      name: "",
      surname: "",
      birthdate: new Date().toISOString(),
      accept: false,
    },
    validationSchema: signUpSchema,
    onSubmit: handleSignUp,
  })

  const isFormFieldValid = (name: keyof SignUpRequest) =>
    !!(formik.touched[name] && formik.errors[name])
  const getFormErrorMessage = (name: keyof SignUpRequest) => {
    return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>
  }

  return !token || signedIn ? (
    <Navigate to="/" replace />
  ) : (
    <div className="flex justify-content-center">
      <div className="card">
        <h5 className="text-center mb-5 text-xl">Zarejestruj się</h5>
        <form onSubmit={formik.handleSubmit} className="p-fluid">
          <div className="field mb-5">
            <span className="p-float-label">
              <InputText
                id="email"
                name="email"
                maxLength={320}
                value={formik.values.email}
                onChange={formik.handleChange}
                autoFocus
                className={classNames({ "p-invalid": isFormFieldValid("email") })}
              />
              <label
                htmlFor="email"
                className={classNames({ "p-error": isFormFieldValid("email") })}
              >
                Adres email*
              </label>
            </span>
            {getFormErrorMessage("email")}
          </div>
          <div className="field mb-5">
            <span className="p-float-label">
              <InputText
                id="username"
                name="username"
                maxLength={85}
                value={formik.values.username}
                onChange={formik.handleChange}
                className={classNames({ "p-invalid": isFormFieldValid("username") })}
              />
              <label
                htmlFor="username"
                className={classNames({ "p-error": isFormFieldValid("username") })}
              >
                Nazwa użytkownika*
              </label>
            </span>
            {getFormErrorMessage("username")}
          </div>
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
          <div className="field-checkbox m-0">
            <Checkbox
              inputId="accept"
              name="accept"
              checked={formik.values.accept}
              onChange={formik.handleChange}
              className={classNames({ "p-invalid": isFormFieldValid("accept") })}
            />
            <label
              htmlFor="accept"
              className={classNames({ "p-error": isFormFieldValid("accept") })}
            >
              Wyrażam zgodę na przetwarzanie danych osobowych*
            </label>
          </div>
          <div className="field">{getFormErrorMessage("accept")}</div>

          <p className="text-xs text-color-secondary">
            Wprowadzone tu dane pojawią się podczas weryfikowania biletu, upewnij się co do ich
            autentyczność
          </p>
          <Button type="submit" label="Potwierdź" className="mt-2" loading={signingUp} />
        </form>
      </div>
    </div>
  )
}

export default SignUp
