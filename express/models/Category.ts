import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Subcategory, SubcategoryId } from './Subcategory.js'

export interface CategoryAttributes {
  idCategory: number
  name: string
}

export type CategoryPk = 'idCategory'
export type CategoryId = Category[CategoryPk]
export type CategoryOptionalAttributes = 'idCategory'
export type CategoryCreationAttributes = Sequelize.Optional<
  CategoryAttributes,
  CategoryOptionalAttributes
>

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  idCategory!: number
  name!: string

  // Category hasMany Subcategory via idCategory
  subcategories!: Subcategory[]
  getSubcategories!: Sequelize.HasManyGetAssociationsMixin<Subcategory>
  setSubcategories!: Sequelize.HasManySetAssociationsMixin<
    Subcategory,
    SubcategoryId
  >

  addSubcategory!: Sequelize.HasManyAddAssociationMixin<
    Subcategory,
    SubcategoryId
  >

  addSubcategories!: Sequelize.HasManyAddAssociationsMixin<
    Subcategory,
    SubcategoryId
  >

  createSubcategory!: Sequelize.HasManyCreateAssociationMixin<Subcategory>

  removeSubcategory!: Sequelize.HasManyRemoveAssociationMixin<
    Subcategory,
    SubcategoryId
  >

  removeSubcategories!: Sequelize.HasManyRemoveAssociationsMixin<
    Subcategory,
    SubcategoryId
  >

  hasSubcategory!: Sequelize.HasManyHasAssociationMixin<
    Subcategory,
    SubcategoryId
  >

  hasSubcategories!: Sequelize.HasManyHasAssociationsMixin<
    Subcategory,
    SubcategoryId
  >

  countSubcategories!: Sequelize.HasManyCountAssociationsMixin

  static initModel(sequelize: Sequelize.Sequelize): typeof Category {
    return Category.init(
      {
        idCategory: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_category'
        },
        name: {
          type: DataTypes.STRING(85),
          allowNull: false,
          unique: 'name_UNIQUE'
        }
      },
      {
        sequelize,
        tableName: 'category',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_category' }]
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
