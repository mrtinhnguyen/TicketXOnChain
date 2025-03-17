import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'

export interface ConfigurationAttributes {
  idConfiguration: number
  name: string
  value: string
}

export type ConfigurationPk = 'idConfiguration'
export type ConfigurationId = Configuration[ConfigurationPk]
export type ConfigurationOptionalAttributes = 'idConfiguration'
export type ConfigurationCreationAttributes = Sequelize.Optional<
  ConfigurationAttributes,
  ConfigurationOptionalAttributes
>

export class Configuration
  extends Model<ConfigurationAttributes, ConfigurationCreationAttributes>
  implements ConfigurationAttributes
{
  idConfiguration!: number
  name!: string
  value!: string

  static initModel(sequelize: Sequelize.Sequelize): typeof Configuration {
    return Configuration.init(
      {
        idConfiguration: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_configuration'
        },
        name: {
          type: DataTypes.STRING(85),
          allowNull: false,
          unique: 'name_UNIQUE'
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'configuration',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_configuration' }]
          },
          {
            name: 'name_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'name' }]
          }
        ]
      }
    )
  }
}
