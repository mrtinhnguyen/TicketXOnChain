import amqplib from 'amqplib'
import config from './config.js'

const { host, user, password } = config.amqp

const amqp = await amqplib.connect(`amqp://${user}:${password}@${host}:5672`)

export default amqp
