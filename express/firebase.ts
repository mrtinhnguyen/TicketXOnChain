import admin from 'firebase-admin'
import type { ServiceAccount } from 'firebase-admin'
import config from './config.js'
import fs from 'node:fs'

const { firebaseAdminSdkLocation, storageBucket } = config

if (!config.test) {
  const serviceAccount = JSON.parse(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fs.readFileSync(firebaseAdminSdkLocation!, 'utf8')
  ) as ServiceAccount

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket
  })
}

export const bucket = !config.test ? admin.storage().bucket() : undefined
