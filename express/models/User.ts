import * as Sequelize from 'sequelize'
import { DataTypes, Model, Op } from 'sequelize'
import type { Artist, ArtistId } from './Artist.js'
import type { Event, EventId } from './Event.js'
import type { Review, ReviewId } from './Review.js'
import type {
  UserFollowArtist,
  UserFollowArtistId
} from './UserFollowArtist.js'
import { generateNonce, SiweMessage } from 'siwe'
import { TokenType } from '../utils/index.js'
import type { Secret } from 'jsonwebtoken'
import config from '../config.js'
import type {
  ISignUpJwtPayload,
  IAuthenticationJwtPayload,
  IRefreshJwtPayload,
  IActivationJwtPayload
} from '../utils/interfaces.js'
import jwt from 'jsonwebtoken'
import type { UserRole } from '../utils/validationSchemas.js'
import transporter from '../nodemailer.js'
import fs from 'node:fs/promises'
import fixture from '../utils/fixture.js'

export interface UserAttributes {
  idUser: number
  publicAddress: string
  nonce: string
  email: string
  username: string
  name: string
  surname: string
  birthdate: string
  role: 'USER' | 'EVENTS_ORGANIZER' | 'ADMINISTRATOR'
  active: number
  created: Date
}

export type UserPk = 'idUser'
export type UserId = User[UserPk]
export type UserOptionalAttributes = 'idUser' | 'role' | 'active' | 'created'
export type UserCreationAttributes = Sequelize.Optional<
  UserAttributes,
  UserOptionalAttributes
>

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  idUser!: number
  publicAddress!: string
  nonce!: string
  email!: string
  username!: string
  name!: string
  surname!: string
  birthdate!: string
  role!: 'USER' | 'EVENTS_ORGANIZER' | 'ADMINISTRATOR'
  active!: number
  created!: Date

  // User belongsToMany Artist via idUser and idArtist
  idArtistArtistUserFollowArtists!: Artist[]
  getIdArtistArtistUserFollowArtists!: Sequelize.BelongsToManyGetAssociationsMixin<Artist>
  setIdArtistArtistUserFollowArtists!: Sequelize.BelongsToManySetAssociationsMixin<
    Artist,
    ArtistId
  >

  addIdArtistArtistUserFollowArtist!: Sequelize.BelongsToManyAddAssociationMixin<
    Artist,
    ArtistId
  >

  addIdArtistArtistUserFollowArtists!: Sequelize.BelongsToManyAddAssociationsMixin<
    Artist,
    ArtistId
  >

  createIdArtistArtistUserFollowArtist!: Sequelize.BelongsToManyCreateAssociationMixin<Artist>

  removeIdArtistArtistUserFollowArtist!: Sequelize.BelongsToManyRemoveAssociationMixin<
    Artist,
    ArtistId
  >

  removeIdArtistArtistUserFollowArtists!: Sequelize.BelongsToManyRemoveAssociationsMixin<
    Artist,
    ArtistId
  >

  hasIdArtistArtistUserFollowArtist!: Sequelize.BelongsToManyHasAssociationMixin<
    Artist,
    ArtistId
  >

  hasIdArtistArtistUserFollowArtists!: Sequelize.BelongsToManyHasAssociationsMixin<
    Artist,
    ArtistId
  >

  countIdArtistArtistUserFollowArtists!: Sequelize.BelongsToManyCountAssociationsMixin
  // User hasMany Event via creatorIdUser
  events!: Event[]
  getEvents!: Sequelize.HasManyGetAssociationsMixin<Event>
  setEvents!: Sequelize.HasManySetAssociationsMixin<Event, EventId>
  addEvent!: Sequelize.HasManyAddAssociationMixin<Event, EventId>
  addEvents!: Sequelize.HasManyAddAssociationsMixin<Event, EventId>
  createEvent!: Sequelize.HasManyCreateAssociationMixin<Event, 'creatorIdUser'>
  removeEvent!: Sequelize.HasManyRemoveAssociationMixin<Event, EventId>
  removeEvents!: Sequelize.HasManyRemoveAssociationsMixin<Event, EventId>
  hasEvent!: Sequelize.HasManyHasAssociationMixin<Event, EventId>
  hasEvents!: Sequelize.HasManyHasAssociationsMixin<Event, EventId>
  countEvents!: Sequelize.HasManyCountAssociationsMixin
  // User hasMany Review via reviewerIdUser
  reviews!: Review[]
  getReviews!: Sequelize.HasManyGetAssociationsMixin<Review>
  setReviews!: Sequelize.HasManySetAssociationsMixin<Review, ReviewId>
  addReview!: Sequelize.HasManyAddAssociationMixin<Review, ReviewId>
  addReviews!: Sequelize.HasManyAddAssociationsMixin<Review, ReviewId>
  createReview!: Sequelize.HasManyCreateAssociationMixin<Review>
  removeReview!: Sequelize.HasManyRemoveAssociationMixin<Review, ReviewId>
  removeReviews!: Sequelize.HasManyRemoveAssociationsMixin<Review, ReviewId>
  hasReview!: Sequelize.HasManyHasAssociationMixin<Review, ReviewId>
  hasReviews!: Sequelize.HasManyHasAssociationsMixin<Review, ReviewId>
  countReviews!: Sequelize.HasManyCountAssociationsMixin
  // User hasMany UserFollowArtist via idUser
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

  static initModel(sequelize: Sequelize.Sequelize): typeof User {
    return User.init(
      {
        idUser: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          field: 'id_user'
        },
        publicAddress: {
          type: DataTypes.CHAR(42),
          allowNull: false,
          unique: 'public_address_UNIQUE',
          field: 'public_address'
        },
        nonce: {
          type: DataTypes.CHAR(17),
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(320),
          allowNull: false,
          unique: 'email_UNIQUE'
        },
        username: {
          type: DataTypes.STRING(85),
          allowNull: false,
          unique: 'username_UNIQUE'
        },
        name: {
          type: DataTypes.STRING(85),
          allowNull: false
        },
        surname: {
          type: DataTypes.STRING(85),
          allowNull: false
        },
        birthdate: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        role: {
          type: DataTypes.ENUM('USER', 'EVENTS_ORGANIZER', 'ADMINISTRATOR'),
          allowNull: false,
          defaultValue: 'USER'
        },
        active: {
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
        tableName: 'user',
        timestamps: false,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'id_user' }]
          },
          {
            name: 'public_address_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'public_address' }]
          },
          {
            name: 'email_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'email' }]
          },
          {
            name: 'username_UNIQUE',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'username' }]
          }
        ]
      }
    )
  }

  static async createUser(signUpToken: string, user: User): Promise<User> {
    const secret: Secret = config.jwt.secret as Secret

    let signUpPayload
    try {
      signUpPayload = jwt.verify(signUpToken, secret) as ISignUpJwtPayload
    } catch (error: any) {
      throw new Error('Invalid registration token')
    }

    const { publicAddress, tokenType } = signUpPayload

    if (tokenType !== TokenType.SIGN_UP) {
      throw new Error('Invalid registration token')
    }

    const foundUser = await User.findOne({
      where: {
        [Op.or]: {
          publicAddress,
          email: user.email,
          username: user.username
        }
      }
    })

    if (foundUser?.email === user.email) {
      throw new Error('Email address already in use')
    }

    if (foundUser?.username === user.username) {
      throw new Error('Username already in use')
    }

    if (foundUser?.publicAddress === publicAddress) {
      throw new Error('User account already exists')
    }

    user.publicAddress = publicAddress
    user.nonce = generateNonce()

    const addedUser = await user.save()

    await User.sendActivationEmail(addedUser)

    return addedUser
  }

  private static async sendActivationEmail(user: User): Promise<void> {
    const secret: Secret = config.jwt.secret as Secret

    const activationPayload: IActivationJwtPayload = {
      idUser: user.idUser,
      tokenType: TokenType.ACTIVATION
    }

    const activationToken = jwt.sign(activationPayload, secret, {
      expiresIn: config.jwt.activationTokenExpirationTime
    })

    const activationLink = `${config.frontendBaseUrl}/activate/${activationToken}`

    const activationEmailTemplate = await fs.readFile(
      './activationEmailTemplate.html'
    )

    if (!config.test) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const info = await transporter!.sendMail({
        from: `"Aplikacja do sprzedaży biletów" <${config.mail.auth.user}>`,
        to: user.email,
        subject: 'Aktywacja konta w aplikacji',
        text: `Aktywuj konto klikając w link: ${activationLink}`,
        html: activationEmailTemplate
          .toString()
          .replace(/{{activationLink}}/g, activationLink)
      })
      console.log('Message sent:', info)
    } else {
      fixture.activationToken = activationToken
    }
  }

  async activate(): Promise<void> {
    this.active = 1
    await this.edit()
  }

  async generateNonce(): Promise<string> {
    if (this.active === 0) {
      await User.sendActivationEmail(this)
      throw new Error('User is not active')
    }

    const nonce = generateNonce()
    this.nonce = nonce

    await this.edit()

    return nonce
  }

  async signIn(message: string, signature: string): Promise<string> {
    const siweMessage = new SiweMessage(message)

    try {
      const { data } = await siweMessage.verify({
        signature,
        nonce: this.nonce
      })

      if (
        data.address !== this.publicAddress ||
        data.uri !== config.frontendBaseUrl ||
        data.chainId !== config.supportedChainId
      ) {
        throw new Error('Invalid authentication message parameters')
      }
    } catch (error: any) {
      throw new Error('Invalid authentication message')
    }

    const tokensPair = await this.generateTokensPair()

    await this.generateNonce()

    return tokensPair
  }

  async generateTokensPair(): Promise<string> {
    const secret: Secret = config.jwt.secret as Secret

    const role = this.role as unknown as UserRole
    const authenticationPayload: IAuthenticationJwtPayload = {
      user: {
        idUser: this.idUser,
        publicAddress: this.publicAddress,
        role
      },
      tokenType: TokenType.AUTHENTICATION
    }
    const refreshPayload: IRefreshJwtPayload = {
      user: {
        idUser: this.idUser,
        publicAddress: this.publicAddress,
        role
      },
      tokenType: TokenType.REFRESH
    }

    const authenticationToken = jwt.sign(authenticationPayload, secret, {
      expiresIn: config.jwt.authenticationTokenExpirationTime
    })
    const refreshToken = jwt.sign(refreshPayload, secret, {
      expiresIn: config.jwt.refreshTokenExpirationTime
    })

    return JSON.stringify({
      authenticationToken,
      refreshToken
    })
  }

  async signOut(): Promise<void> {}

  async edit(): Promise<void> {
    await this.save()
  }

  async generateSalesReport(): Promise<string> {
    const dailyIncome = await this.sequelize.query(
      `
        SELECT
          e.id_event 'idEvent', e.name 'eventName', di.date, di.income, di.ticket_count 'ticketCount'
        FROM
          daily_income di
        JOIN
          event e USING(id_event)
        WHERE
          di.creator_id_user = :idUser
        ORDER BY
          di.date ASC
        LIMIT 30;
      `,
      {
        replacements: { idUser: this.idUser },
        type: Sequelize.QueryTypes.SELECT
      }
    )

    const monthlyIncome = await this.sequelize.query(
      `
        SELECT
          e.id_event 'idEvent', e.name 'eventName', mi.date, mi.income, mi.ticket_count 'ticketCount'
        FROM
          monthly_income mi
        JOIN
          event e USING(id_event)
        WHERE
          mi.creator_id_user = :idUser
        ORDER BY
          mi.date ASC
        LIMIT 12;
      `,
      {
        replacements: { idUser: this.idUser },
        type: Sequelize.QueryTypes.SELECT
      }
    )

    const annualIncome = await this.sequelize.query(
      `
        SELECT
          e.id_event 'idEvent', e.name 'eventName', ai.date, ai.income, ai.ticket_count 'ticketCount'
        FROM
          annual_income ai
        JOIN
          event e USING(id_event)
        WHERE
          ai.creator_id_user = :idUser
        ORDER BY
          ai.date ASC
        LIMIT 5
      `,
      {
        replacements: { idUser: this.idUser },
        type: Sequelize.QueryTypes.SELECT
      }
    )

    const ticketCountByCategory = await this.sequelize.query(
      `
        SELECT
          id_category 'idCategory', category_name 'categoryName', ticket_count 'ticketCount'
        FROM
          ticket_count_by_category
        WHERE
          creator_id_user = :idUser
        ORDER BY
          categoryName ASC;
      `,
      {
        replacements: { idUser: this.idUser },
        type: Sequelize.QueryTypes.SELECT
      }
    )

    return JSON.stringify({
      dailyIncome,
      monthlyIncome,
      annualIncome,
      ticketCountByCategory
    })
  }

  async delete(): Promise<void> {
    this.role = 'USER'
    await this.edit()
  }

  async createArtist(artist: Artist): Promise<Artist> {
    const createdArtist = await artist.save()
    return createdArtist
  }

  async createEventsOrganizer(user: User): Promise<User> {
    user.role = 'EVENTS_ORGANIZER'
    const eventsOrganizer = await user.save()
    return eventsOrganizer
  }

  async createAdministrator(user: User): Promise<User> {
    user.role = 'ADMINISTRATOR'
    const administrator = await user.save()
    return administrator
  }
}
