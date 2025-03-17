import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Event, EventId } from './Event.js'
import type { EventHasArtist, EventHasArtistId } from './EventHasArtist.js'
import type { Review, ReviewId } from './Review.js'
import type { Upload, UploadId } from './Upload.js'
import type { User, UserId } from './User.js'
import type { UserFollowArtistId } from './UserFollowArtist.js'
import { UserFollowArtist } from './UserFollowArtist.js'
import type { IUser } from '../utils/interfaces.js'

export interface ArtistAttributes {
  idArtist: number
  pictureIdUpload: number
  name: string
  description: string
}

export type ArtistPk = 'idArtist'
export type ArtistId = Artist[ArtistPk]
export type ArtistOptionalAttributes = 'idArtist'
export type ArtistCreationAttributes = Sequelize.Optional<
  ArtistAttributes,
  ArtistOptionalAttributes
>

export class Artist
  extends Model<ArtistAttributes, ArtistCreationAttributes>
  implements ArtistAttributes
{
  idArtist!: number
  pictureIdUpload!: number
  name!: string
  description!: string

  // Artist belongsToMany Event via idArtist and idEvent
  idEventEvents!: Event[]
  getIdEventEvents!: Sequelize.BelongsToManyGetAssociationsMixin<Event>
  setIdEventEvents!: Sequelize.BelongsToManySetAssociationsMixin<Event, EventId>
  addIdEventEvent!: Sequelize.BelongsToManyAddAssociationMixin<Event, EventId>
  addIdEventEvents!: Sequelize.BelongsToManyAddAssociationsMixin<Event, EventId>
  createIdEventEvent!: Sequelize.BelongsToManyCreateAssociationMixin<Event>
  removeIdEventEvent!: Sequelize.BelongsToManyRemoveAssociationMixin<
    Event,
    EventId
  >

  removeIdEventEvents!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    Event,
    EventId
  >

  hasIdEventEvent!: Sequelize.BelongsToManyHasAssociationMixin<Event, EventId>

  hasIdEventEvents!: Sequelize.BelongsToManyHasAssociationsMixin<Event, EventId>

  countIdEventEvents!: Sequelize.BelongsToManyCountAssociationsMixin
  // Artist hasMany EventHasArtist via idArtist
  eventHasArtists!: EventHasArtist[]
  getEventHasArtists!: Sequelize.HasManyGetAssociationsMixin<EventHasArtist>
  setEventHasArtists!: Sequelize.HasManySetAssociationsMixin<
    EventHasArtist,
    EventHasArtistId
  >

  addEventHasArtist!: Sequelize.HasManyAddAssociationMixin<
    EventHasArtist,
    EventHasArtistId
  >

  addEventHasArtists!: Sequelize.HasManyAddAssociationsMixin<
    EventHasArtist,
    EventHasArtistId
  >

  createEventHasArtist!: Sequelize.HasManyCreateAssociationMixin<EventHasArtist>

  removeEventHasArtist!: Sequelize.HasManyRemoveAssociationMixin<
    EventHasArtist,
    EventHasArtistId
  >

  removeEventHasArtists!: Sequelize.HasManyRemoveAssociationsMixin<
    EventHasArtist,
    EventHasArtistId
  >

  hasEventHasArtist!: Sequelize.HasManyHasAssociationMixin<
    EventHasArtist,
    EventHasArtistId
  >

  hasEventHasArtists!: Sequelize.HasManyHasAssociationsMixin<
    EventHasArtist,
    EventHasArtistId
  >

  countEventHasArtists!: Sequelize.HasManyCountAssociationsMixin
  // Artist hasMany Review via reviewedIdArtist
  reviews!: Review[]
  getReviews!: Sequelize.HasManyGetAssociationsMixin<Review>
  setReviews!: Sequelize.HasManySetAssociationsMixin<Review, ReviewId>
  addReview!: Sequelize.HasManyAddAssociationMixin<Review, ReviewId>
  addReviews!: Sequelize.HasManyAddAssociationsMixin<Review, ReviewId>
  createReview!: Sequelize.HasManyCreateAssociationMixin<
    Review,
    'reviewedIdArtist'
  >

  removeReview!: Sequelize.HasManyRemoveAssociationMixin<Review, ReviewId>
  removeReviews!: Sequelize.HasManyRemoveAssociationsMixin<Review, ReviewId>
  hasReview!: Sequelize.HasManyHasAssociationMixin<Review, ReviewId>
  hasReviews!: Sequelize.HasManyHasAssociationsMixin<Review, ReviewId>
  countReviews!: Sequelize.HasManyCountAssociationsMixin
  // Artist belongsToMany User via idArtist and idUser
  idUserUsers!: User[]
  getIdUserUsers!: Sequelize.BelongsToManyGetAssociationsMixin<User>
  setIdUserUsers!: Sequelize.BelongsToManySetAssociationsMixin<User, UserId>
  addIdUserUser!: Sequelize.BelongsToManyAddAssociationMixin<User, UserId>
  addIdUserUsers!: Sequelize.BelongsToManyAddAssociationsMixin<User, UserId>
  createIdUserUser!: Sequelize.BelongsToManyCreateAssociationMixin<User>
  removeIdUserUser!: Sequelize.BelongsToManyRemoveAssociationMixin<User, UserId>
  removeIdUserUsers!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    User,
    UserId
  >

  hasIdUserUser!: Sequelize.BelongsToManyHasAssociationMixin<User, UserId>

  hasIdUserUsers!: Sequelize.BelongsToManyHasAssociationsMixin<User, UserId>

  countIdUserUsers!: Sequelize.BelongsToManyCountAssociationsMixin
  // Artist hasMany UserFollowArtist via idArtist
  userFollowArtists!: UserFollowArtist[]
  getUserFollowArtists!: Sequelize.HasManyGetAssociationsMixin<UserFollowArtist>

  setUserFollowArtists!: Sequelize.HasManySetAssociationsMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  addUserFollowArtist!: Sequelize.HasManyAddAssociationMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  addUserFollowArtists!: Sequelize.HasManyAddAssociationsMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  createUserFollowArtist!: Sequelize.HasManyCreateAssociationMixin<UserFollowArtist>

  removeUserFollowArtist!: Sequelize.HasManyRemoveAssociationMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  removeUserFollowArtists!: Sequelize.HasManyRemoveAssociationsMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  hasUserFollowArtist!: Sequelize.HasManyHasAssociationMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  hasUserFollowArtists!: Sequelize.HasManyHasAssociationsMixin<
    UserFollowArtist,
    UserFollowArtistId
  >

  countUserFollowArtists!: Sequelize.HasManyCountAssociationsMixin
  // Artist belongsTo Upload via pictureIdUpload
  pictureIdUploadUpload!: Upload
  getPictureIdUploadUpload!: Sequelize.BelongsToGetAssociationMixin<Upload>
  setPictureIdUploadUpload!: Sequelize.BelongsToSetAssociationMixin<
    Upload,
    UploadId
  >

  createPictureIdUploadUpload!: Sequelize.BelongsToCreateAssociationMixin<Upload>

  static initModel(sequelize: Sequelize.Sequelize): typeof Artist {
    return Artist.init(
      {
        idArtist: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_artist'
        },
        pictureIdUpload: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'upload',
            key: 'id_upload'
          },
          field: 'picture_id_upload'
        },
        name: {
          type: DataTypes.STRING(85),
          allowNull: false,
          unique: 'name_UNIQUE'
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'artist',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_artist' }]
          },
          {
            name: 'name_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'name' }]
          },
          {
            name: 'fk_artist_upload1_idx',
            using: 'BTREE',
            fields: [{ name: 'picture_id_upload' }]
          }
        ]
      }
    )
  }

  async follow(user: IUser): Promise<void> {
    const foundUserFollowArtist = await UserFollowArtist.findOne({
      where: {
        idUser: user.idUser,
        idArtist: this.idArtist
      }
    })

    if (foundUserFollowArtist !== null) {
      throw new Error('User already follows artist')
    }

    await UserFollowArtist.create({
      idUser: user.idUser,
      idArtist: this.idArtist
    })
  }

  async unfollow(user: IUser): Promise<void> {
    const result = await UserFollowArtist.destroy({
      where: {
        idUser: user.idUser,
        idArtist: this.idArtist
      }
    })

    if (result === 0) {
      throw new Error('User does not follow artist')
    }
  }

  async edit(): Promise<void> {
    await this.save()
  }
}
