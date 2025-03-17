import * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Artist, ArtistId } from './Artist.js'
import type { User, UserId } from './User.js'

export interface ReviewAttributes {
  idReview: number
  reviewerIdUser: number
  reviewedIdArtist: number
  title: string
  eventLocation: string
  eventDate: string
  content: string
  rate: number
  approved: number
  created: Date
}

export type ReviewPk = 'idReview'
export type ReviewId = Review[ReviewPk]
export type ReviewOptionalAttributes = 'idReview' | 'approved' | 'created'
export type ReviewCreationAttributes = Sequelize.Optional<
  ReviewAttributes,
  ReviewOptionalAttributes
>

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  idReview!: number
  reviewerIdUser!: number
  reviewedIdArtist!: number
  title!: string
  eventLocation!: string
  eventDate!: string
  content!: string
  rate!: number
  approved!: number
  created!: Date

  // Review belongsTo Artist via reviewedIdArtist
  reviewedIdArtistArtist!: Artist
  getreviewedIdArtistArtist!: Sequelize.BelongsToGetAssociationMixin<Artist>
  setreviewedIdArtistArtist!: Sequelize.BelongsToSetAssociationMixin<
    Artist,
    ArtistId
  >

  createreviewedIdArtistArtist!: Sequelize.BelongsToCreateAssociationMixin<Artist>
  // Review belongsTo User via reviewerIdUser
  reviewerIdUserUser!: User
  getReviewerIdUserUser!: Sequelize.BelongsToGetAssociationMixin<User>
  setReviewerIdUserUser!: Sequelize.BelongsToSetAssociationMixin<User, UserId>
  createReviewerIdUserUser!: Sequelize.BelongsToCreateAssociationMixin<User>

  static initModel(sequelize: Sequelize.Sequelize): typeof Review {
    return Review.init(
      {
        idReview: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_review'
        },
        reviewerIdUser: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id_user'
          },
          field: 'reviewer_id_user'
        },
        reviewedIdArtist: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'artist',
            key: 'id_artist'
          },
          field: 'reviewed_id_artist'
        },
        title: {
          type: DataTypes.STRING(85),
          allowNull: false
        },
        eventLocation: {
          type: DataTypes.STRING(120),
          allowNull: false,
          field: 'event_location'
        },
        eventDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'event_date'
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        rate: {
          type: DataTypes.TINYINT,
          allowNull: false
        },
        approved: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 0
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.Sequelize.fn('current_timestamp')
        }
      },
      {
        sequelize,
        tableName: 'review',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_review' }]
          },
          {
            name: 'fk_review_user1_idx',
            using: 'BTREE',
            fields: [{ name: 'reviewer_id_user' }]
          },
          {
            name: 'fk_review_artist1_idx',
            using: 'BTREE',
            fields: [{ name: 'reviewed_id_artist' }]
          }
        ]
      }
    )
  }

  async approve(): Promise<void> {
    this.approved = 1
    await this.save()
  }

  async delete(): Promise<void> {
    await this.destroy()
  }
}
