import { Card } from "primereact/card"
import { Skeleton } from "primereact/skeleton"
import styles from "~/App.module.css"

const header = (
  <div className={styles.cardImageContainer}>
    <Skeleton height="100%" borderRadius="0" className="mx-auto"></Skeleton>
  </div>
)
const footer = <Skeleton width="10rem" height="2.56rem" className="mx-auto"></Skeleton>

function CardSkeleton({ details }: { details: boolean }) {
  return (
    <Card
      title={<Skeleton height="2rem" width="12rem" className="mx-auto"></Skeleton>}
      subTitle={
        details ? (
          <div
            style={{
              minHeight: "3rem",
            }}
          >
            {<Skeleton className="mx-auto"></Skeleton>}
          </div>
        ) : undefined
      }
      footer={footer}
      header={header}
    >
      {details && (
        <>
          <Skeleton height="1.5rem" width="5rem" className="mb-3 mx-auto"></Skeleton>
          <Skeleton width="10rem" height="1.3rem" className="my-3 mx-auto"></Skeleton>
          <Skeleton width="11rem" height="1.3rem" className="my-3 mx-auto"></Skeleton>
          <Skeleton width="13rem" height="1.3rem" className="my-3 mx-auto"></Skeleton>
          <Skeleton width="12rem" height="1.3rem" className="my-3 mx-auto"></Skeleton>
        </>
      )}
    </Card>
  )
}

export default CardSkeleton
