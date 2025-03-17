import * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Event } from './Event.js'

export interface TicketAttributes {
  idTicket: number
  ticketAddress: string
  userAddress: string
  tokenId: number
  price: number
  created: Date
  used: number
}

export type TicketPk = 'idTicket'
export type TicketId = Ticket[TicketPk]
export type TicketOptionalAttributes = 'idTicket' | 'created' | 'used'
export type TicketCreationAttributes = Sequelize.Optional<
  TicketAttributes,
  TicketOptionalAttributes
>

export class Ticket
  extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes
{
  idTicket!: number
  ticketAddress!: string
  userAddress!: string
  tokenId!: number
  price!: number
  created!: Date
  used!: number

  Event?: Event

  static initModel(sequelize: Sequelize.Sequelize): typeof Ticket {
    return Ticket.init(
      {
        idTicket: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_ticket'
        },
        ticketAddress: {
          type: DataTypes.CHAR(42),
          allowNull: false,
          field: 'ticket_address'
        },
        userAddress: {
          type: DataTypes.CHAR(42),
          allowNull: false,
          field: 'user_address'
        },
        tokenId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'token_id'
        },
        price: {
          type: DataTypes.DECIMAL(30, 2),
          allowNull: false
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.Sequelize.fn('current_timestamp')
        },
        used: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        sequelize,
        tableName: 'ticket',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_ticket' }]
          },
          {
            name: 'ticket_address_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'ticket_address' }, { name: 'token_id' }]
          },
          {
            name: 'user_address_idx',
            using: 'BTREE',
            fields: [{ name: 'user_address' }]
          },
          {
            name: 'ticket_address_idx',
            using: 'BTREE',
            fields: [{ name: 'ticket_address' }]
          }
        ]
      }
    )
  }

  async pass(walletAddress: string): Promise<void> {
    this.userAddress = walletAddress
    await this.edit()
  }

  async use(): Promise<void> {
    this.used = 1
    await this.edit()
  }

  async edit(): Promise<void> {
    await this.save()
  }
}
