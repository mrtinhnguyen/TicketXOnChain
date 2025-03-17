import * as Sequelize from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import type { Artist, ArtistId } from './Artist.js'
import type { City, CityId } from './City.js'
import type { EventHasArtist, EventHasArtistId } from './EventHasArtist.js'
import type { EventHasUpload, EventHasUploadId } from './EventHasUpload.js'
import type { Subcategory, SubcategoryId } from './Subcategory.js'
import type { Upload, UploadId } from './Upload.js'
import type { UserId } from './User.js'
import { User } from './User.js'
import { Ticket } from './Ticket.js'
import { web3, account } from '../utils/index.js'
import TicketFactorySmartContract from '../utils/ticket-factory.js'
import TicketHandlerSmartContract from '../utils/ticket-handler.js'
import TicketSmartContract from '../utils/ticket.js'
import config from '../config.js'
import amqp from '../rabbitmq.js'
import type { ConsumeMessage } from 'amqplib'

export interface EventAttributes {
  idEvent: number
  creatorIdUser: number
  idSubcategory: number
  idCity: number
  statuteIdUpload?: number
  nftImageIdUpload?: number
  name: string
  tags: string
  description: string
  contractAddress?: string
  video?: string
  ticketPrice: number
  ticketCount: number
  maxTicketsPerUser: number
  location: string
  street: string
  postalCode: string
  start: Date
  publish: Date
  draft: number
  likes: number
  transferable: number
  created: Date
  purchasedTicketCount?: number
}

export type EventPk = 'idEvent'
export type EventId = Event[EventPk]
export type EventOptionalAttributes =
  | 'idEvent'
  | 'statuteIdUpload'
  | 'nftImageIdUpload'
  | 'contractAddress'
  | 'video'
  | 'draft'
  | 'likes'
  | 'created'
export type EventCreationAttributes = Sequelize.Optional<
  EventAttributes,
  EventOptionalAttributes
>

export class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  idEvent!: number
  creatorIdUser!: number
  idSubcategory!: number
  idCity!: number
  statuteIdUpload?: number
  nftImageIdUpload?: number
  name!: string
  tags!: string
  description!: string
  contractAddress?: string
  video?: string
  ticketPrice!: number
  ticketCount!: number
  maxTicketsPerUser!: number
  location!: string
  street!: string
  postalCode!: string
  start!: Date
  publish!: Date
  draft!: number
  likes!: number
  transferable!: number
  created!: Date

  // Event belongsTo City via idCity
  idCityCity!: City
  getIdCityCity!: Sequelize.BelongsToGetAssociationMixin<City>
  setIdCityCity!: Sequelize.BelongsToSetAssociationMixin<City, CityId>
  createIdCityCity!: Sequelize.BelongsToCreateAssociationMixin<City>
  // Event belongsToMany Artist via idEvent and idArtist
  idArtistArtists!: Artist[]
  getIdArtistArtists!: Sequelize.BelongsToManyGetAssociationsMixin<Artist>
  setIdArtistArtists!: Sequelize.BelongsToManySetAssociationsMixin<
    Artist,
    ArtistId
  >

  addIdArtistArtist!: Sequelize.BelongsToManyAddAssociationMixin<
    Artist,
    ArtistId
  >

  addIdArtistArtists!: Sequelize.BelongsToManyAddAssociationsMixin<
    Artist,
    ArtistId
  >

  createIdArtistArtist!: Sequelize.BelongsToManyCreateAssociationMixin<Artist>

  removeIdArtistArtist!: Sequelize.BelongsToManyRemoveAssociationMixin<
    Artist,
    ArtistId
  >

  removeIdArtistArtists!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    Artist,
    ArtistId
  >

  hasIdArtistArtist!: Sequelize.BelongsToManyHasAssociationMixin<
    Artist,
    ArtistId
  >

  hasIdArtistArtists!: Sequelize.BelongsToManyHasAssociationsMixin<
    Artist,
    ArtistId
  >

  countIdArtistArtists!: Sequelize.BelongsToManyCountAssociationsMixin
  // Event hasMany EventHasArtist via idEvent
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
  // Event hasMany EventHasUpload via idEvent
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
  // Event belongsToMany Upload via idEvent and idUpload
  idUploadUploads!: Upload[]
  getIdUploadUploads!: Sequelize.BelongsToManyGetAssociationsMixin<Upload>
  setIdUploadUploads!: Sequelize.BelongsToManySetAssociationsMixin<
    Upload,
    UploadId
  >

  addIdUploadUpload!: Sequelize.BelongsToManyAddAssociationMixin<
    Upload,
    UploadId
  >

  addIdUploadUploads!: Sequelize.BelongsToManyAddAssociationsMixin<
    Upload,
    UploadId
  >

  createIdUploadUpload!: Sequelize.BelongsToManyCreateAssociationMixin<Upload>

  removeIdUploadUpload!: Sequelize.BelongsToManyRemoveAssociationMixin<
    Upload,
    UploadId
  >

  removeIdUploadUploads!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    Upload,
    UploadId
  >

  hasIdUploadUpload!: Sequelize.BelongsToManyHasAssociationMixin<
    Upload,
    UploadId
  >

  hasIdUploadUploads!: Sequelize.BelongsToManyHasAssociationsMixin<
    Upload,
    UploadId
  >

  countIdUploadUploads!: Sequelize.BelongsToManyCountAssociationsMixin
  // Event belongsTo Subcategory via idSubcategory
  idSubcategorySubcategory!: Subcategory
  getIdSubcategorySubcategory!: Sequelize.BelongsToGetAssociationMixin<Subcategory>
  setIdSubcategorySubcategory!: Sequelize.BelongsToSetAssociationMixin<
    Subcategory,
    SubcategoryId
  >

  createIdSubcategorySubcategory!: Sequelize.BelongsToCreateAssociationMixin<Subcategory>
  // Event belongsTo Upload via statuteIdUpload
  statuteIdUploadUpload!: Upload
  getStatuteIdUploadUpload!: Sequelize.BelongsToGetAssociationMixin<Upload>
  setStatuteIdUploadUpload!: Sequelize.BelongsToSetAssociationMixin<
    Upload,
    UploadId
  >

  createStatuteIdUploadUpload!: Sequelize.BelongsToCreateAssociationMixin<Upload>
  // Event belongsTo Upload via nftImageIdUpload
  nftImageIdUploadUpload!: Upload
  getNftImageIdUploadUpload!: Sequelize.BelongsToGetAssociationMixin<Upload>
  setNftImageIdUploadUpload!: Sequelize.BelongsToSetAssociationMixin<
    Upload,
    UploadId
  >

  createNftImageIdUploadUpload!: Sequelize.BelongsToCreateAssociationMixin<Upload>
  // Event belongsTo User via creatorIdUser
  creatorIdUserUser!: User
  getCreatorIdUserUser!: Sequelize.BelongsToGetAssociationMixin<User>
  setCreatorIdUserUser!: Sequelize.BelongsToSetAssociationMixin<User, UserId>
  createCreatorIdUserUser!: Sequelize.BelongsToCreateAssociationMixin<User>

  static initModel(sequelize: Sequelize.Sequelize): typeof Event {
    return Event.init(
      {
        idEvent: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_event'
        },
        creatorIdUser: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id_user'
          },
          field: 'creator_id_user'
        },
        idSubcategory: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'subcategory',
            key: 'id_subcategory'
          },
          field: 'id_subcategory'
        },
        idCity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'city',
            key: 'id_city'
          },
          field: 'id_city'
        },
        statuteIdUpload: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'upload',
            key: 'id_upload'
          },
          field: 'statute_id_upload'
        },
        nftImageIdUpload: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'upload',
            key: 'id_upload'
          },
          field: 'nft_image_id_upload'
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: 'name_UNIQUE'
        },
        tags: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        contractAddress: {
          type: DataTypes.CHAR(42),
          allowNull: true,
          unique: 'contract_address_UNIQUE',
          field: 'contract_address'
        },
        video: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        ticketPrice: {
          type: DataTypes.DECIMAL(30, 2),
          allowNull: false,
          field: 'ticket_price'
        },
        ticketCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'ticket_count'
        },
        maxTicketsPerUser: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'max_tickets_per_user'
        },
        location: {
          type: DataTypes.STRING(120),
          allowNull: false
        },
        street: {
          type: DataTypes.STRING(85),
          allowNull: false
        },
        postalCode: {
          type: DataTypes.CHAR(6),
          allowNull: false,
          field: 'postal_code'
        },
        start: {
          type: DataTypes.DATE,
          allowNull: false
        },
        publish: {
          type: DataTypes.DATE,
          allowNull: false
        },
        draft: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 1
        },
        likes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        transferable: {
          type: DataTypes.TINYINT,
          allowNull: false
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.Sequelize.fn('current_timestamp')
        }
      },
      {
        sequelize,
        tableName: 'event',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_event' }]
          },
          {
            name: 'name_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'name' }]
          },
          {
            name: 'contract_address_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'contract_address' }]
          },
          {
            name: 'fk_event_subcategory1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_subcategory' }]
          },
          {
            name: 'fk_event_city1_idx',
            using: 'BTREE',
            fields: [{ name: 'id_city' }]
          },
          {
            name: 'fk_event_user1_idx',
            using: 'BTREE',
            fields: [{ name: 'creator_id_user' }]
          },
          {
            name: 'fk_event_upload1_idx',
            using: 'BTREE',
            fields: [{ name: 'statute_id_upload' }]
          },
          {
            name: 'fk_event_upload2_idx',
            using: 'BTREE',
            fields: [{ name: 'nft_image_id_upload' }]
          },
          {
            name: 'name_tags_description_FULLTEXT',
            type: 'FULLTEXT',
            fields: [
              { name: 'name' },
              { name: 'tags' },
              { name: 'description' }
            ]
          }
        ]
      }
    )
  }

  static async approveTicket(uuid: string, signature: string): Promise<void> {
    let address
    try {
      address = web3.eth.accounts.recover(uuid, signature)
    } catch (error: any) {
      throw new Error('Unable to approve ticket verification')
    }

    const channel = await amqp.createChannel()

    const result = channel.sendToQueue(uuid, Buffer.from(address))

    await channel.close()

    if (!result) {
      throw new Error('Unable to approve ticket verification')
    }
  }

  async like(): Promise<void> {
    await this.increment('likes')
  }

  async createTicket(
    walletAddress: string,
    price: number,
    tokenId: number
  ): Promise<Ticket> {
    const createdTicket = await Ticket.create({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ticketAddress: this.contractAddress!,
      userAddress: walletAddress,
      tokenId,
      price
    })
    return createdTicket
  }

  async edit(): Promise<void> {
    await this.save()
  }

  async verifyTicketPossession(
    walletAddress: string,
    activeMode: boolean
  ): Promise<string> {
    if (this.contractAddress == null) {
      throw new Error('Event has no smart contract associated')
    }

    let hasTicket = false
    let isTicketUsed = null

    if (!config.test) {
      const contract = new web3.eth.Contract(
        TicketSmartContract,
        this.contractAddress
      )
      const contractHandler = new web3.eth.Contract(
        TicketHandlerSmartContract,
        config.smartContracts.ticketHandlerAddress
      )

      let index = 0
      let tokenId = null
      try {
        do {
          const tokenOfOwnerByIndexMethod =
            contract.methods.tokenOfOwnerByIndex(walletAddress, index)
          tokenId = await tokenOfOwnerByIndexMethod.call()
          hasTicket = true

          const isTicketUsedMethod = contract.methods.isTicketUsed(tokenId)
          isTicketUsed = await isTicketUsedMethod.call()
          ++index
        } while (isTicketUsed)
      } catch (error: any) {
        console.error(error)
        if (
          error.innerError?.errorSignature !==
          'ERC721OutOfBoundsIndex(address,uint256)'
        ) {
          throw new Error('Unable to get user ticket details')
        }
      }

      if (activeMode && isTicketUsed === false && tokenId !== null) {
        const setTicketUsedMethod = contractHandler.methods.setTicketUsed(
          this.contractAddress,
          tokenId,
          true
        )

        try {
          const feeData = await web3.eth.calculateFeeData()

          const signedTransaction = await web3.eth.accounts.signTransaction(
            {
              data: setTicketUsedMethod.encodeABI(),
              from: web3.eth.defaultAccount,
              to: config.smartContracts.ticketHandlerAddress,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
            },
            account.privateKey
          )
          await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
        } catch (error: any) {
          console.error(error)
          throw new Error('Unable to use ticket')
        }
      }
    }

    const owner = await User.findOne({
      where: {
        publicAddress: walletAddress
      },
      attributes: [
        'idUser',
        'publicAddress',
        'email',
        'username',
        'name',
        'surname',
        'birthdate',
        'role',
        'created'
      ]
    })

    return JSON.stringify({
      hasTicket,
      isTicketUsed,
      user: hasTicket && owner !== null ? owner : null
    })
  }

  async subscribeTicketApproval(uuid: string): Promise<string> {
    const channel = await amqp.createChannel()

    await channel.assertQueue(uuid)

    let msg: ConsumeMessage
    try {
      msg = await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout has passed'))
        }, config.longPollingTimeout)

        channel
          .consume(
            uuid,
            (msg) => {
              if (msg !== null) {
                resolve(msg)
              } else {
                reject(new Error('Consumer cancelled by server'))
              }
            },
            {
              exclusive: true,
              noAck: true
            }
          )
          .then(() => {})
          .catch((error) => {
            reject(error)
          })
      })
    } catch (error: any) {
      await channel.close()

      throw error
    }

    const address = msg.content.toString()

    return await this.verifyTicketPossession(address, true)
  }

  async approve(): Promise<void> {
    if (!config.test) {
      const symbol = this.name
        .split(' ')
        .reduce((acc, value) => acc + value.toUpperCase(), '')

      const contract = new web3.eth.Contract(
        TicketFactorySmartContract,
        config.smartContracts.ticketFactoryAddress
      )

      try {
        const createTicketMethod = contract.methods.createTicket(
          this.idEvent,
          this.name,
          symbol,
          this.creatorIdUserUser.publicAddress,
          this.ticketCount,
          Math.trunc(this.ticketPrice),
          this.maxTicketsPerUser,
          `${config.backendBaseUrl}/events/${this.idEvent}/tickets/`,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          config.smartContracts.ticketHandlerAddress!,
          Math.floor(this.publish.getTime() / 1000),
          this.transferable === 1
        )

        const feeData = await web3.eth.calculateFeeData()

        const signedTransaction = await web3.eth.accounts.signTransaction(
          {
            data: createTicketMethod.encodeABI(),
            from: web3.eth.defaultAccount,
            to: config.smartContracts.ticketFactoryAddress,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
          },
          account.privateKey
        )
        await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
      } catch (error: any) {
        console.error(error)
        throw new Error('Unable to create event smart contract')
      }
    }
  }

  async delete(): Promise<void> {
    await this.destroy()
  }
}
