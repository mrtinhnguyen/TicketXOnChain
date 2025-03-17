import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Artist, ArtistId } from './Artist.js'
import type { User, UserId } from './User.js'

export interface UserFollowArtistAttributes {
  idUser: number
  idArtist: number
}

export type UserFollowArtistPk = 'idUser' | 'idArtist'
export type UserFollowArtistId = UserFollowArtist[UserFollowArtistPk]
export type UserFollowArtistCreationAttributes = UserFollowArtistAttributes

export class UserFollowArtist
  extends Model<UserFollowArtistAttributes, UserFollowArtistCreationAttributes>
  implements UserFollowArtistAttributes
{
  idUser!: number
  idArtist!: number

  // UserFollowArtist belongsTo Artist via idArtist
  idArtistArtist!: Artist
  getIdArtistArtist!: Sequelize.BelongsToGetAssociationMixin<Artist>
  setIdArtistArtist!: Sequelize.BelongsToSetAssociationMixin<Artist, ArtistId>
  createIdArtistArtist!: Sequelize.BelongsToCreateAssociationMixin<Artist>
  // UserFollowArtist belongsTo User via idUser
  idUserUser!: User
  getIdUserUser!: Sequelize.BelongsToGetAssociationMixin<User>
  setIdUserUser!: Sequelize.BelongsToSetAssociationMixin<User, UserId>
  createIdUserUser!: Sequelize.BelongsToCreateAssociationMixin<User>

  static initModel(sequelize: Sequelize.Sequelize): typeof UserFollowArtist {
    return UserFollowArtist.init(
      {
        idUser: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'user',
            key: 'id_user'
          },
          field: 'id_user'
        },
        idArtist: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'artist',
            key: 'id_artist'
          },
          field: 'id_artist'
        }
      },
      {
        sequelize,
        tableName: 'user_follow_artist',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_user' }, { name: 'id_artist' }]
          },
          {
            name: 'id_user_id_artist_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_user' }, { name: 'id_artist' }]
          },
          {
            name: 'fk_user_has_artist_artist1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_artist' }]
          },
          {
            name: 'fk_user_has_artist_user1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_user' }]
          }
        ]
      }
    )
  }
}
