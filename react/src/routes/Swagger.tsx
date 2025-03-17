import SwaggerUI from "swagger-ui-react"

import "swagger-ui-react/swagger-ui.css"

function Swagger() {
  return <SwaggerUI url="/openapi3_1.yaml" />
}

export default Swagger
