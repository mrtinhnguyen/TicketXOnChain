import { useState, useEffect, useCallback } from "react"
import type { RefObject } from "react"
import type { Toast } from "primereact/toast"
import { useOutletContext } from "react-router-dom"
import { userRoleToString, formatDatetime } from "~/utils"
import client from "~/utils/client"
import { Button } from "primereact/button"
import EditUserRoleDialog from "~/components/user/EditUserRoleDialog"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { InputText } from "primereact/inputtext"
import { Toolbar } from "primereact/toolbar"
import type { Paths } from "~/utils/types/openapi.d.ts"
import { IconField } from "primereact/iconfield"
import { InputIcon } from "primereact/inputicon"
import { Tag } from "primereact/tag"

function Users() {
  const { toast } = useOutletContext<{ toast: RefObject<Toast> }>()

  const [editUserRoleVisible, setEditUserRoleVisible] = useState(false)

  const [users, setUsers] = useState<Paths.ListUsers.Responses.$200 | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const editUserRoleButtonTemplate = useCallback(
    (user: any) => (
      <Button
        label="Edytuj"
        severity="danger"
        size="small"
        icon="pi pi-external-link"
        onClick={() => {
          setSelectedUser(user)
          setEditUserRoleVisible(true)
        }}
      />
    ),
    []
  )

  const [search, setSearch] = useState<string>("")

  const [filters, setFilters] = useState<object>({})

  const [loading, setLoading] = useState<boolean>(false)

  const [rowsPerPage] = useState(3)
  const [page, setPage] = useState(1)

  const handleListUsers = useCallback(async () => {
    setLoading(true)
    setUsers(null)
    const result = await client.ListUsers({ search: search !== "" ? search : undefined, page })
    setUsers(result.data)
    setLoading(false)
  }, [search, page])

  useEffect(() => {
    if (users) {
      setPage(users.currentPage)
    }
  }, [users])

  const filter = () => {
    setPage(1)
    setFilters({})
  }

  const resetFilters = () => {
    setSearch("")
    setPage(1)
    setFilters({})
  }

  useEffect(() => {
    handleListUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const centerContent = (
    <IconField iconPosition="left" className="w-full md:w-14rem md:mr-2 mb-2 md:m-0">
      <InputIcon className="pi pi-search" aria-label="Szukaj" />
      <InputText
        id="search"
        type="search"
        placeholder="Szukaj"
        className="w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </IconField>
  )

  const endContent = (
    <>
      <Button
        label="Filtruj"
        size="small"
        icon="pi pi-search"
        severity="warning"
        className="mr-2"
        onClick={filter}
        disabled={loading}
      />
      <Button
        label="Resetuj"
        size="small"
        icon="pi pi-times"
        severity="secondary"
        onClick={resetFilters}
        disabled={loading}
      />
    </>
  )

  const onPage = useCallback((event: any) => {
    setPage(event.first / 3 + 1)
    setFilters({})
  }, [])

  return (
    <>
      <h2 className="mt-0">Użytkownicy</h2>
      <div className="mb-5">
        <Toolbar center={centerContent} end={endContent} />
      </div>
      <DataTable
        value={users?.results}
        paginator
        rows={rowsPerPage}
        first={(page - 1) * rowsPerPage}
        totalRecords={users?.count}
        onPage={onPage}
        tableStyle={{ minWidth: "50rem" }}
        loading={loading}
        lazy
        emptyMessage="Nie znaleziono użytkowników"
      >
        <Column field="email" header="Email"></Column>
        <Column field="username" header="Nazwa użytkownika"></Column>
        <Column body={(user) => userRoleToString(user.role)} header="Rola"></Column>
        <Column
          header="Aktywny"
          body={(user: any) =>
            user.active ? <Tag severity="success">Tak</Tag> : <Tag severity="danger">Nie</Tag>
          }
        ></Column>
        <Column body={(user) => formatDatetime(new Date(user.created))} header="Utworzono"></Column>
        <Column header="Opcje" body={editUserRoleButtonTemplate}></Column>
      </DataTable>
      <EditUserRoleDialog
        revalidate={handleListUsers}
        toast={toast}
        user={selectedUser}
        header="Edytuj rolę użytkownika"
        visible={editUserRoleVisible}
        style={{ width: "100%", maxWidth: "500px" }}
        className="m-3"
        onHide={() => setEditUserRoleVisible(false)}
        draggable={false}
      />
    </>
  )
}

export default Users
