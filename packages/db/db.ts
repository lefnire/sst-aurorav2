import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import * as schema from './schemas'

// TODO use this instead, for IAM authentication instead of user/password
// import { fromIni } from '@aws-sdk/credential-providers';

export const dbName = process.env.RDS_DB_NAME!
let connectionString: string

if (process.env.RDS_SECRET_ARN?.length) {
  // In this case make sure you have a local Postgres database running, eg via Docker
  const secretArn = process.env.RDS_SECRET_ARN
  const secretsManagerClient = new SecretsManagerClient({ region: process.env.REGION })
  const secretData = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretArn }))
  const secretValue = JSON.parse(secretData.SecretString)
  const {username, password, host, port} = secretValue
  connectionString = `postgresql://${username}:${password}@${host}:${port}/${dbName}`
} else {
  connectionString = `postgresql://postgres:password@localhost/${dbName}:5432`
}

const dbClient = postgres(connectionString, { max: 1 });
export const db = drizzle(dbClient, {schema})