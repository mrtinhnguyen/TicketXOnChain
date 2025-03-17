import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Artist, ArtistId } from './Artist.js'
import type { Event, EventId } from './Event.js'
import type { EventHasUpload, EventHasUploadId } from './EventHasUpload.js'

export interface UploadAttributes {
  idUpload: number
  url: string
  type: 'FILE' | 'IMAGE'
}

export type UploadPk = 'idUpload'
export type UploadId = Upload[UploadPk]
export type UploadOptionalAttributes = 'idUpload'
export type UploadCreationAttributes = Sequelize.Optional<
  UploadAttributes,
  UploadOptionalAttributes
>

export class Upload
  extends Model<UploadAttributes, UploadCreationAttributes>
  implements UploadAttributes
{
  idUpload!: number
  url!: string
  type!: 'FILE' | 'IMAGE'

  // Upload hasMany Artist via pictureIdUpload
  artists!: Artist[]
  getArtists!: Sequelize.HasManyGetAssociationsMixin<Artist>
  setArtists!: Sequelize.HasManySetAssociationsMixin<Artist, ArtistId>
  addArtist!: Sequelize.HasManyAddAssociationMixin<Artist, ArtistId>
  addArtists!: Sequelize.HasManyAddAssociationsMixin<Artist, ArtistId>
  createArtist!: Sequelize.HasManyCreateAssociationMixin<Artist>
  removeArtist!: Sequelize.HasManyRemoveAssociationMixin<Artist, ArtistId>
  removeArtists!: Sequelize.HasManyRemoveAssociationsMixin<Artist, ArtistId>
  hasArtist!: Sequelize.HasManyHasAssociationMixin<Artist, ArtistId>
  hasArtists!: Sequelize.HasManyHasAssociationsMixin<Artist, ArtistId>
  countArtists!: Sequelize.HasManyCountAssociationsMixin
  // Upload hasMany Event via statuteIdUpload
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
  // Upload hasMany Event via nftImageIdUpload
  nftImageIdUploadEvents!: Event[]
  getNftImageIdUploadEvents!: Sequelize.HasManyGetAssociationsMixin<Event>
  setNftImageIdUploadEvents!: Sequelize.HasManySetAssociationsMixin<
    Event,
    EventId
  >

  addNftImageIdUploadEvent!: Sequelize.HasManyAddAssociationMixin<
    Event,
    EventId
  >

  addNftImageIdUploadEvents!: Sequelize.HasManyAddAssociationsMixin<
    Event,
    EventId
  >

  createNftImageIdUploadEvent!: Sequelize.HasManyCreateAssociationMixin<Event>

  removeNftImageIdUploadEvent!: Sequelize.HasManyRemoveAssociationMixin<
    Event,
    EventId
  >

  removeNftImageIdUploadEvents!: Sequelize.HasManyRemoveAssociationsMixin<
    Event,
    EventId
  >

  hasNftImageIdUploadEvent!: Sequelize.HasManyHasAssociationMixin<
    Event,
    EventId
  >

  hasNftImageIdUploadEvents!: Sequelize.HasManyHasAssociationsMixin<
    Event,
    EventId
  >

  countNftImageIdUploadEvents!: Sequelize.HasManyCountAssociationsMixin
  // Upload belongsToMany Event via idUpload and idEvent
  idEventEventEventHasUploads!: Event[]
  getIdEventEventEventHasUploads!: Sequelize.BelongsToManyGetAssociationsMixin<Event>
  setIdEventEventEventHasUploads!: Sequelize.BelongsToManySetAssociationsMixin<
    Event,
    EventId
  >

  addIdEventEventEventHasUpload!: Sequelize.BelongsToManyAddAssociationMixin<
    Event,
    EventId
  >

  addIdEventEventEventHasUploads!: Sequelize.BelongsToManyAddAssociationsMixin<
    Event,
    EventId
  >

  createIdEventEventEventHasUpload!: Sequelize.BelongsToManyCreateAssociationMixin<Event>

  removeIdEventEventEventHasUpload!: Sequelize.BelongsToManyRemoveAssociationMixin<
    Event,
    EventId
  >

  removeIdEventEventEventHasUploads!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    Event,
    EventId
  >

  hasIdEventEventEventHasUpload!: Sequelize.BelongsToManyHasAssociationMixin<
    Event,
    EventId
  >

  hasIdEventEventEventHasUploads!: Sequelize.BelongsToManyHasAssociationsMixin<
    Event,
    EventId
  >

  countIdEventEventEventHasUploads!: Sequelize.BelongsToManyCountAssociationsMixin
  // Upload hasMany EventHasUpload via idUpload
  eventHasUploads!: EventHasUpload[]
  getEventHasUploads!: Sequelize.HasManyGetAssociationsMixin<EventHasUpload>
  setEventHasUploads!: Sequelize.HasManySetAssociationsMixin<
    EventHasUpload,
    EventHasUploadId
  >

  addEventHasUpload!: Sequelize.HasManyAddAssociationMixin<
    EventHasUpload,
    EventHasUploadId
  >

  addEventHasUploads!: Sequelize.HasManyAddAssociationsMixin<
    EventHasUpload,
    EventHasUploadId
  >

  createEventHasUpload!: Sequelize.HasManyCreateAssociationMixin<EventHasUpload>

  removeEventHasUpload!: Sequelize.HasManyRemoveAssociationMixin<
    EventHasUpload,
    EventHasUploadId
  >

  removeEventHasUploads!: Sequelize.HasManyRemoveAssociationsMixin<
    EventHasUpload,
    EventHasUploadId
  >

  hasEventHasUpload!: Sequelize.HasManyHasAssociationMixin<
    EventHasUpload,
    EventHasUploadId
  >

  hasEventHasUploads!: Sequelize.HasManyHasAssociationsMixin<
    EventHasUpload,
    EventHasUploadId
  >

  countEventHasUploads!: Sequelize.HasManyCountAssociationsMixin

  static initModel(sequelize: Sequelize.Sequelize): typeof Upload {
    return Upload.init(
      {
        idUpload: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_upload'
        },
        url: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: 'url_UNIQUE'
        },
        type: {
          type: DataTypes.BLOB,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'upload',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_upload' }]
          },
          {
            name: 'url_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'url' }]
          }
        ]
      }
    )
  }
}
