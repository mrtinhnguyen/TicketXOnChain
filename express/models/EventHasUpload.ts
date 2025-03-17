import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Event, EventId } from './Event.js'
import type { Upload, UploadId } from './Upload.js'

export interface EventHasUploadAttributes {
  idEvent: number
  idUpload: number
}

export type EventHasUploadPk = 'idEvent' | 'idUpload'
export type EventHasUploadId = EventHasUpload[EventHasUploadPk]
export type EventHasUploadCreationAttributes = EventHasUploadAttributes

export class EventHasUpload
  extends Model<EventHasUploadAttributes, EventHasUploadCreationAttributes>
  implements EventHasUploadAttributes
{
  idEvent!: number
  idUpload!: number

  // EventHasUpload belongsTo Event via idEvent
  idEventEvent!: Event
  getIdEventEvent!: Sequelize.BelongsToGetAssociationMixin<Event>
  setIdEventEvent!: Sequelize.BelongsToSetAssociationMixin<Event, EventId>
  createIdEventEvent!: Sequelize.BelongsToCreateAssociationMixin<Event>
  // EventHasUpload belongsTo Upload via idUpload
  idUploadUpload!: Upload
  getIdUploadUpload!: Sequelize.BelongsToGetAssociationMixin<Upload>
  setIdUploadUpload!: Sequelize.BelongsToSetAssociationMixin<Upload, UploadId>
  createIdUploadUpload!: Sequelize.BelongsToCreateAssociationMixin<Upload>

  static initModel(sequelize: Sequelize.Sequelize): typeof EventHasUpload {
    return EventHasUpload.init(
      {
        idEvent: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'event',
            key: 'id_event'
          },
          field: 'id_event'
        },
        idUpload: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'upload',
            key: 'id_upload'
          },
          field: 'id_upload'
        }
      },
      {
        sequelize,
        tableName: 'event_has_upload',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_event' }, { name: 'id_upload' }]
          },
          {
            name: 'id_event_id_upload_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_event' }, { name: 'id_upload' }]
          },
          {
            name: 'fk_event_has_upload_upload1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_upload' }]
          },
          {
            name: 'fk_event_has_upload_event1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_event' }]
          }
        ]
      }
    )
  }
}
