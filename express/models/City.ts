import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Event, EventId } from './Event.js'

export interface CityAttributes {
  idCity: number
  name: string
  coordinates: any
}

export type CityPk = 'idCity'
export type CityId = City[CityPk]
export type CityOptionalAttributes = 'idCity'
export type CityCreationAttributes = Sequelize.Optional<
  CityAttributes,
  CityOptionalAttributes
>

export class City
  extends Model<CityAttributes, CityCreationAttributes>
  implements CityAttributes
{
  idCity!: number
  name!: string
  coordinates!: any

  // City hasMany Event via idCity
  events!: Event[]
  getEvents!: Sequelize.HasManyGetAssociationsMixin<Event>
  setEvents!: Sequelize.HasManySetAssociationsMixin<Event, EventId>
  addEvent!: Sequelize.HasManyAddAssociationMixin<Event, EventId>
  addEvents!: Sequelize.HasManyAddAssociationsMixin<Event, EventId>
  createEvent!: Sequelize.HasManyCreateAssociationMixin<Event>
  removeEvent!: Sequelize.HasManyRemoveAssociationMixin<Event, EventId>
  removeEvents!: Sequelize.HasManyRemoveAssociationsMixin<Event, EventId>
  hasEvent!: Sequelize.HasManyHasAssociationMixin<Event, EventId>
  hasEvents!: Sequelize.HasManyHasAssociationsMixin<Event, EventId>
  countEvents!: Sequelize.HasManyCountAssociationsMixin

  static initModel(sequelize: Sequelize.Sequelize): typeof City {
    return City.init(
      {
        idCity: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_city'
        },
        name: {
          type: DataTypes.STRING(85),
          allowNull: false,
          unique: 'name_UNIQUE'
        },
        coordinates: {
          type: 'POINT',
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'city',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_city' }]
          },
          {
            name: 'name_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'name' }]
          },
          {
            name: 'coordinates_SPATIAL',
            type: 'SPATIAL',
            fields: [{ name: 'coordinates', length: 32 }]
          }
        ]
      }
    )
  }
}
