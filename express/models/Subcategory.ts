import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Category, CategoryId } from './Category.js'
import type { Event, EventId } from './Event.js'

export interface SubcategoryAttributes {
  idSubcategory: number
  idCategory: number
  name: string
}

export type SubcategoryPk = 'idSubcategory'
export type SubcategoryId = Subcategory[SubcategoryPk]
export type SubcategoryOptionalAttributes = 'idSubcategory'
export type SubcategoryCreationAttributes = Sequelize.Optional<
  SubcategoryAttributes,
  SubcategoryOptionalAttributes
>

export class Subcategory
  extends Model<SubcategoryAttributes, SubcategoryCreationAttributes>
  implements SubcategoryAttributes
{
  idSubcategory!: number
  idCategory!: number
  name!: string

  // Subcategory belongsTo Category via idCategory
  idCategoryCategory!: Category
  getIdCategoryCategory!: Sequelize.BelongsToGetAssociationMixin<Category>
  setIdCategoryCategory!: Sequelize.BelongsToSetAssociationMixin<
    Category,
    CategoryId
  >

  createIdCategoryCategory!: Sequelize.BelongsToCreateAssociationMixin<Category>
  // Subcategory hasMany Event via idSubcategory
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

  static initModel(sequelize: Sequelize.Sequelize): typeof Subcategory {
    return Subcategory.init(
      {
        idSubcategory: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_subcategory'
        },
        idCategory: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'category',
            key: 'id_category'
          },
          field: 'id_category'
        },
        name: {
          type: DataTypes.STRING(85),
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'subcategory',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_subcategory' }]
          },
          {
            name: 'id_category_name_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'name' }, { name: 'id_category' }]
          },
          {
            name: 'fk_subcategory_category_idx',
            using: 'BTREE',
            fields: [{ name: 'id_category' }]
          }
        ]
      }
    )
  }
}
