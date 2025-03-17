import type { Sequelize } from 'sequelize'
import { Artist as _Artist } from './Artist.js'
import type { ArtistAttributes, ArtistCreationAttributes } from './Artist.js'
import { Category as _Category } from './Category.js'
import type {
  CategoryAttributes,
  CategoryCreationAttributes
} from './Category.js'
import { City as _City } from './City.js'
import type { CityAttributes, CityCreationAttributes } from './City.js'
import { Configuration as _Configuration } from './Configuration.js'
import type {
  ConfigurationAttributes,
  ConfigurationCreationAttributes
} from './Configuration.js'
import { Event as _Event } from './Event.js'
import type { EventAttributes, EventCreationAttributes } from './Event.js'
import { EventHasArtist as _EventHasArtist } from './EventHasArtist.js'
import type {
  EventHasArtistAttributes,
  EventHasArtistCreationAttributes
} from './EventHasArtist.js'
import { EventHasUpload as _EventHasUpload } from './EventHasUpload.js'
import type {
  EventHasUploadAttributes,
  EventHasUploadCreationAttributes
} from './EventHasUpload.js'
import { Review as _Review } from './Review.js'
import type { ReviewAttributes, ReviewCreationAttributes } from './Review.js'
import { Subcategory as _Subcategory } from './Subcategory.js'
import type {
  SubcategoryAttributes,
  SubcategoryCreationAttributes
} from './Subcategory.js'
import { Ticket as _Ticket } from './Ticket.js'
import type { TicketAttributes, TicketCreationAttributes } from './Ticket.js'
import { Upload as _Upload } from './Upload.js'
import type { UploadAttributes, UploadCreationAttributes } from './Upload.js'
import { User as _User } from './User.js'
import type { UserAttributes, UserCreationAttributes } from './User.js'
import { UserFollowArtist as _UserFollowArtist } from './UserFollowArtist.js'
import type {
  UserFollowArtistAttributes,
  UserFollowArtistCreationAttributes
} from './UserFollowArtist.js'

export {
  _Artist as Artist,
  _Category as Category,
  _City as City,
  _Configuration as Configuration,
  _Event as Event,
  _EventHasArtist as EventHasArtist,
  _EventHasUpload as EventHasUpload,
  _Review as Review,
  _Subcategory as Subcategory,
  _Ticket as Ticket,
  _Upload as Upload,
  _User as User,
  _UserFollowArtist as UserFollowArtist
}

export type {
  ArtistAttributes,
  ArtistCreationAttributes,
  CategoryAttributes,
  CategoryCreationAttributes,
  CityAttributes,
  CityCreationAttributes,
  ConfigurationAttributes,
  ConfigurationCreationAttributes,
  EventAttributes,
  EventCreationAttributes,
  EventHasArtistAttributes,
  EventHasArtistCreationAttributes,
  EventHasUploadAttributes,
  EventHasUploadCreationAttributes,
  ReviewAttributes,
  ReviewCreationAttributes,
  SubcategoryAttributes,
  SubcategoryCreationAttributes,
  TicketAttributes,
  TicketCreationAttributes,
  UploadAttributes,
  UploadCreationAttributes,
  UserAttributes,
  UserCreationAttributes,
  UserFollowArtistAttributes,
  UserFollowArtistCreationAttributes
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function initModels(sequelize: Sequelize) {
  const Artist = _Artist.initModel(sequelize)
  const Category = _Category.initModel(sequelize)
  const City = _City.initModel(sequelize)
  const Configuration = _Configuration.initModel(sequelize)
  const Event = _Event.initModel(sequelize)
  const EventHasArtist = _EventHasArtist.initModel(sequelize)
  const EventHasUpload = _EventHasUpload.initModel(sequelize)
  const Review = _Review.initModel(sequelize)
  const Subcategory = _Subcategory.initModel(sequelize)
  const Ticket = _Ticket.initModel(sequelize)
  const Upload = _Upload.initModel(sequelize)
  const User = _User.initModel(sequelize)
  const UserFollowArtist = _UserFollowArtist.initModel(sequelize)

  Artist.belongsToMany(Event, {
    as: 'idEventEvents',
    through: EventHasArtist,
    foreignKey: 'idArtist',
    otherKey: 'idEvent'
  })
  Artist.belongsToMany(User, {
    as: 'idUserUsers',
    through: UserFollowArtist,
    foreignKey: 'idArtist',
    otherKey: 'idUser'
  })
  Event.belongsToMany(Artist, {
    as: 'idArtistArtists',
    through: EventHasArtist,
    foreignKey: 'idEvent',
    otherKey: 'idArtist'
  })
  Event.belongsToMany(Upload, {
    as: 'idUploadUploads',
    through: EventHasUpload,
    foreignKey: 'idEvent',
    otherKey: 'idUpload'
  })
  Upload.belongsToMany(Event, {
    as: 'idEventEventEventHasUploads',
    through: EventHasUpload,
    foreignKey: 'idUpload',
    otherKey: 'idEvent'
  })
  User.belongsToMany(Artist, {
    as: 'idArtistArtistUserFollowArtists',
    through: UserFollowArtist,
    foreignKey: 'idUser',
    otherKey: 'idArtist'
  })
  EventHasArtist.belongsTo(Artist, {
    as: 'idArtistArtist',
    foreignKey: 'idArtist'
  })
  Artist.hasMany(EventHasArtist, {
    as: 'eventHasArtists',
    foreignKey: 'idArtist'
  })
  Review.belongsTo(Artist, {
    as: 'reviewedIdArtistArtist',
    foreignKey: 'reviewedIdArtist'
  })
  Artist.hasMany(Review, { as: 'reviews', foreignKey: 'reviewedIdArtist' })
  UserFollowArtist.belongsTo(Artist, {
    as: 'idArtistArtist',
    foreignKey: 'idArtist'
  })
  Artist.hasMany(UserFollowArtist, {
    as: 'userFollowArtists',
    foreignKey: 'idArtist'
  })
  Subcategory.belongsTo(Category, {
    as: 'idCategoryCategory',
    foreignKey: 'idCategory'
  })
  Category.hasMany(Subcategory, {
    as: 'subcategories',
    foreignKey: 'idCategory'
  })
  Event.belongsTo(City, { as: 'idCityCity', foreignKey: 'idCity' })
  City.hasMany(Event, { as: 'events', foreignKey: 'idCity' })
  EventHasArtist.belongsTo(Event, { as: 'idEventEvent', foreignKey: 'idEvent' })
  Event.hasMany(EventHasArtist, {
    as: 'eventHasArtists',
    foreignKey: 'idEvent'
  })
  EventHasUpload.belongsTo(Event, { as: 'idEventEvent', foreignKey: 'idEvent' })
  Event.hasMany(EventHasUpload, {
    as: 'eventHasUploads',
    foreignKey: 'idEvent'
  })
  Event.belongsTo(Subcategory, {
    as: 'idSubcategorySubcategory',
    foreignKey: 'idSubcategory'
  })
  Subcategory.hasMany(Event, { as: 'events', foreignKey: 'idSubcategory' })
  Artist.belongsTo(Upload, {
    as: 'pictureIdUploadUpload',
    foreignKey: 'pictureIdUpload'
  })
  Upload.hasMany(Artist, { as: 'artists', foreignKey: 'pictureIdUpload' })
  Event.belongsTo(Upload, {
    as: 'statuteIdUploadUpload',
    foreignKey: 'statuteIdUpload'
  })
  Upload.hasMany(Event, { as: 'events', foreignKey: 'statuteIdUpload' })
  Event.belongsTo(Upload, {
    as: 'nftImageIdUploadUpload',
    foreignKey: 'nftImageIdUpload'
  })
  Upload.hasMany(Event, {
    as: 'nftImageIdUploadEvents',
    foreignKey: 'nftImageIdUpload'
  })
  EventHasUpload.belongsTo(Upload, {
    as: 'idUploadUpload',
    foreignKey: 'idUpload'
  })
  Upload.hasMany(EventHasUpload, {
    as: 'eventHasUploads',
    foreignKey: 'idUpload'
  })
  Event.belongsTo(User, {
    as: 'creatorIdUserUser',
    foreignKey: 'creatorIdUser'
  })
  User.hasMany(Event, { as: 'events', foreignKey: 'creatorIdUser' })
  Review.belongsTo(User, {
    as: 'reviewerIdUserUser',
    foreignKey: 'reviewerIdUser'
  })
  User.hasMany(Review, { as: 'reviews', foreignKey: 'reviewerIdUser' })
  UserFollowArtist.belongsTo(User, { as: 'idUserUser', foreignKey: 'idUser' })
  User.hasMany(UserFollowArtist, {
    as: 'userFollowArtists',
    foreignKey: 'idUser'
  })

  return {
    Artist,
    Category,
    City,
    Configuration,
    Event,
    EventHasArtist,
    EventHasUpload,
    Review,
    Subcategory,
    Ticket,
    Upload,
    User,
    UserFollowArtist
  }
}
