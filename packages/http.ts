import {APIGatewayProxyHandlerV2} from 'aws-lambda'
import {db} from './db/db'
import * as schemas from './db/schemas'
import {createInsertSchema} from 'drizzle-zod'

const PostNote = createInsertSchema(schemas.notes)

export const main: APIGatewayProxyHandlerV2 = async (event, context) => {
  const defaultRes = { statusCode: 200, body: "success" }
  const {method, path} = event.requestContext.http
  if (method === "POST" && path === "/notes") {
    const body = PostNote.parse(JSON.parse(event.body!))
    const note = await db.insert(schemas.notes).values(body).returning()
    return {statusCode: 200, body: JSON.stringify(note)}
  }
  return defaultRes
}
