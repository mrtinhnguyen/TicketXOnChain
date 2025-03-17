import type * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Artist, ArtistId } from './Artist.js'
import type { Event, EventId } from './Event.js'

export interface EventHasArtistAttributes {
  idEvent: number
  idArtist: number
}

export type EventHasArtistPk = 'idEvent' | 'idArtist'
export type EventHasArtistId = EventHasArtist[EventHasArtistPk]
export type EventHasArtistCreationAttributes = EventHasArtistAttributes

export class EventHasArtist
  extends Model<EventHasArtistAttributes, EventHasArtistCreationAttributes>
  implements EventHasArtistAttributes
{
  idEvent!: number
  idArtist!: number

  // EventHasArtist belongsTo Artist via idArtist
  idArtistArtist!: Artist
  getIdArtistArtist!: Sequelize.BelongsToGetAssociationMixin<Artist>
  setIdArtistArtist!: Sequelize.BelongsToSetAssociationMixin<Artist, ArtistId>
  createIdArtistArtist!: Sequelize.BelongsToCreateAssociationMixin<Artist>
  // EventHasArtist belongsTo Event via idEvent
  idEventEvent!: Event
  getIdEventEvent!: Sequelize.BelongsToGetAssociationMixin<Event>
  setIdEventEvent!: Sequelize.BelongsToSetAssociationMixin<Event, EventId>
  createIdEventEvent!: Sequelize.BelongsToCreateAssociationMixin<Event>

  static initModel(sequelize: Sequelize.Sequelize): typeof EventHasArtist {
    return EventHasArtist.init(
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
        tableName: 'event_has_artist',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_event' }, { name: 'id_artist' }]
          },
          {
            name: 'id_event_id_artist_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_event' }, { name: 'id_artist' }]
          },
          {
            name: 'fk_event_has_artist_artist1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_artist' }]
          },
          {
            name: 'fk_event_has_artist_event1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_event' }]
          }
        ]
      }
    )
  }
}
