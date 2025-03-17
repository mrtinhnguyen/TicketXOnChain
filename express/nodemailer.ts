import nodemailer from 'nodemailer'
import type { TransportOptions } from 'nodemailer'
import config from './config.js'

const { mail } = config

const transporter = !config.test
  ? nodemailer.createTransport(mail as TransportOptions)
  : undefined

export default transporter
