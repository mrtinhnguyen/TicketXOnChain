import { Sequelize } from 'sequelize'
import config from './config.js'

const { host, database, user, password, timezone, logging } = config.database

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const sequelize = new Sequelize(database!, user!, password, {
  host,
  dialect: 'mariadb',
  dialectOptions: {
    useUTC: true
  },
  timezone,
  logging
})

export default sequelize
