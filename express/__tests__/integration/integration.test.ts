// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import request from 'supertest'
import sequelize from '../../sequelize.js'
import redis from '../../redis.js'
import amqp from '../../rabbitmq.js'
import app from '../../app.js'
import config from '../../config.js'
import { web3, account } from '../../utils/index.js'
import { User } from '../../models/User.js'
import { SiweMessage } from 'siwe'
import { UserRole } from '../../utils/validationSchemas.js'
import fixture from '../../utils/fixture.js'
import { Upload } from '../../models/Upload.js'
import { Event } from '../../models/Event.js'
import { Artist } from '../../models/Artist.js'

let user

afterAll(async () => {
  await sequelize.close()
  await redis.quit()
  await amqp.close()
})

describe('Testing default listings', () => {
  it('list artists', async () => {
    const expectedRes = {
      count: 0,
      pages: 1,
      currentPage: 1,
      results: []
    }

    const res = await request(app)
      .get('/api/artists')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(res.body).toEqual(expectedRes)
  })

  it('list categories', async () => {
    const expectedRes = [
      {
        idCategory: 1,
        name: 'Muzyka',
        subcategories: [
          { idSubcategory: 1, name: 'Disco Polo' },
          { idSubcategory: 2, name: 'Klasyczna' },
          { idSubcategory: 3, name: 'Metal' },
          { idSubcategory: 4, name: 'Pop' },
          { idSubcategory: 5, name: 'Rap' },
          { idSubcategory: 6, name: 'Techno' },
          { idSubcategory: 7, name: 'Trance' },
          { idSubcategory: 22, name: 'Inne' }
        ]
      },
      {
        idCategory: 2,
        name: 'Sport',
        subcategories: [
          { idSubcategory: 8, name: 'Koszykówka' },
          { idSubcategory: 9, name: 'Lekkoatletyka' },
          { idSubcategory: 10, name: 'Piłka nożna' },
          { idSubcategory: 11, name: 'Żużel' },
          { idSubcategory: 23, name: 'Inne' }
        ]
      },
      {
        idCategory: 4,
        name: 'Teatr',
        subcategories: [
          { idSubcategory: 16, name: 'Komedia' },
          { idSubcategory: 17, name: 'Musical' },
          { idSubcategory: 18, name: 'Opera' },
          { idSubcategory: 19, name: 'Tragedia' },
          { idSubcategory: 25, name: 'Inne' }
        ]
      },
      {
        idCategory: 3,
        name: 'Widowisko',
        subcategories: [
          { idSubcategory: 12, name: 'Kabaret' },
          { idSubcategory: 13, name: 'Kino' },
          { idSubcategory: 14, name: 'Show' },
          { idSubcategory: 15, name: 'Stand-up' },
          { idSubcategory: 24, name: 'Inne' }
        ]
      },
      {
        idCategory: 5,
        name: 'Wystawy',
        subcategories: [
          { idSubcategory: 20, name: 'Muzeum' },
          { idSubcategory: 21, name: 'Targi' },
          { idSubcategory: 26, name: 'Inne' }
        ]
      }
    ]

    const res = await request(app)
      .get('/api/categories')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(res.body).toEqual(expectedRes)
  })

  it('list cities', async () => {
    const expectedRes = [
      { idCity: 2, name: 'Białystok' },
      { idCity: 4, name: 'Bydgoszcz' },
      { idCity: 9, name: 'Częstochowa' },
      { idCity: 3, name: 'Gdańsk' },
      { idCity: 10, name: 'Katowice' },
      { idCity: 11, name: 'Kraków' },
      { idCity: 7, name: 'Łódź' },
      { idCity: 12, name: 'Lublin' },
      { idCity: 6, name: 'Poznań' },
      { idCity: 5, name: 'Szczecin' },
      { idCity: 1, name: 'Warszawa' },
      { idCity: 8, name: 'Wrocław' }
    ]

    const res = await request(app)
      .get('/api/cities')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(res.body).toEqual(expectedRes)
  })

  it('list approved events', async () => {
    const expectedRes = {
      count: 0,
      pages: 1,
      currentPage: 1,
      results: []
    }

    const res = await request(app)
      .get('/api/events')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(res.body).toEqual(expectedRes)
  })
})

describe('Testing users endpoints', () => {
  afterEach(async () => {
    await resetUsers()
  })

  it('sign up user', async () => {
    const {
      body: { signUpToken }
    } = await request(app)
      .post('/api/users/nonce')
      .send({
        publicAddress: web3.eth.defaultAccount
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404)

    expect(signUpToken).toBeDefined()

    await request(app)
      .post('/api/users/sign-up')
      .send({
        signUpToken,
        email: 'adam.smith@example.com',
        username: 'adam.smith89',
        name: 'Adam',
        surname: 'Smith',
        birthdate: '1989-02-21'
      })
      .expect(204)
  })

  it('activate user', async () => {
    await addUser(false)

    await request(app)
      .post('/api/users/nonce')
      .send({
        publicAddress: user.publicAddress
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)

    await request(app)
      .post('/api/users/activate')
      .send({
        activationToken: fixture.activationToken
      })
      .expect(204)

    const foundUser = await User.findOne({
      attributes: ['active'],
      where: {
        publicAddress: user.publicAddress
      }
    })

    expect(foundUser.active).toBe(1)
  })

  it('sign in user and refresh tokens', async () => {
    const { authenticationToken, refreshToken } = await signIn()

    expect(authenticationToken).toBeDefined()
    expect(refreshToken).toBeDefined()

    const {
      body: {
        authenticationToken: refreshedAuthenticationToken,
        refreshToken: refreshedRefreshToken
      }
    } = await request(app)
      .post('/api/users/refresh')
      .send({
        refreshToken
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(refreshedAuthenticationToken).toBeDefined()
    expect(refreshedRefreshToken).toBeDefined()
  })

  it('get user details', async () => {
    const { authenticationToken } = await signIn()

    const expectedUserDetails = {
      publicAddress: '0x9eF7149A67A4Bf875648581b8E96Bd8C5283cb75',
      email: 'adam.smith@example.com',
      username: 'adam.smith89',
      name: 'Adam',
      surname: 'Smith',
      birthdate: '1989-02-21',
      role: 'USER'
    }

    const userDetails = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authenticationToken}`)
      .expect('Content-Type', /json/)
      .expect(200)

    expect(userDetails.body).toMatchObject(expectedUserDetails)
  })
})

describe('Testing events organizer endpoints', () => {
  let authenticationToken

  beforeAll(async () => {
    authenticationToken = (await signIn(UserRole.EVENTS_ORGANIZER))
      .authenticationToken
  })

  afterAll(async () => {
    await resetUsers()
  })

  it('create event', async () => {
    const newUpload = await Upload.create({
      url: '',
      type: 'IMAGE'
    })

    const newArtist = await Artist.create({
      pictureIdUpload: newUpload.idUpload,
      name: "Ethan O'Kelly",
      description: 'Scottish football player.'
    })

    const name = 'Football match'

    const newEvent = await request(app)
      .post('/api/events')
      .send({
        idSubcategory: 10,
        cityName: 'Łódź',
        statuteIdUpload: null,
        nftImageIdUpload: null,
        name,
        tags: 'football,match,sport',
        description: 'Football match of local teams.',
        video: null,
        ticketPrice: '2000000000000000.00',
        ticketCount: 100,
        maxTicketsPerUser: 2,
        location: 'Athletics stadium',
        street: 'ul. Piotrkowska 29',
        postalCode: '90-103',
        start: '2999-01-01T00:00:00Z',
        publish: '2999-01-01T00:00:00Z',
        draft: true,
        transferable: false,
        images: [newUpload.idUpload],
        artists: [newArtist.idArtist]
      })
      .set('Authorization', `Bearer ${authenticationToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)

    expect(newEvent.body.name).toEqual(name)

    await Event.destroy({
      where: {},
      cascade: true
    })

    await Artist.destroy({
      where: {},
      cascade: true
    })

    await Upload.destroy({
      where: {},
      cascade: true
    })
  })

  it('get sales report', async () => {
    const expectedRes = {
      dailyIncome: [],
      monthlyIncome: [],
      annualIncome: [],
      ticketCountByCategory: []
    }

    const res = await request(app)
      .get('/api/users/me/sales-report')
      .set('Authorization', `Bearer ${authenticationToken}`)
      .expect('Content-Type', /json/)
      .expect(200)

    expect(res.body).toEqual(expectedRes)
  })
})

describe('Testing administrator endpoints', () => {
  let authenticationToken

  beforeAll(async () => {
    authenticationToken = (await signIn(UserRole.ADMINISTRATOR))
      .authenticationToken
  })

  afterAll(async () => {
    await resetUsers()
  })

  it('list users', async () => {
    const expectedRes = {
      count: 1,
      pages: 1,
      currentPage: 1,
      results: [
        {
          publicAddress: '0x9eF7149A67A4Bf875648581b8E96Bd8C5283cb75',
          email: 'adam.smith@example.com',
          username: 'adam.smith89',
          role: 'ADMINISTRATOR',
          active: 1
        }
      ]
    }

    const res = await request(app)
      .get('/api/users?search=smith&page=1')
      .set('Authorization', `Bearer ${authenticationToken}`)
      .expect('Content-Type', /json/)
      .expect(200)

    expect(res.body).toMatchObject(expectedRes)
  })

  it('update user role', async () => {
    const newUser = await User.create({
      publicAddress: '0x0000000000000000000000000000000000000000',
      nonce: '',
      email: 'emma.brown@example.com',
      username: 'emma.brown99',
      name: 'Emma',
      surname: 'Brown',
      birthdate: '1999-01-01',
      role: UserRole.USER,
      active: 1
    })

    const role = 'EVENTS_ORGANIZER'

    const updatedUser = await request(app)
      .patch(`/api/users/${newUser.idUser}`)
      .send({
        role
      })
      .set('Authorization', `Bearer ${authenticationToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(updatedUser.body.role).toEqual(role)
  })

  it('create artist', async () => {
    const newUpload = await Upload.create({
      url: '',
      type: 'IMAGE'
    })

    const name = 'Frank Sinatra'

    const newArtist = await request(app)
      .post('/api/artists')
      .send({
        pictureIdUpload: newUpload.idUpload,
        name,
        description: 'American signer and actor.'
      })
      .set('Authorization', `Bearer ${authenticationToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)

    expect(newArtist.body.name).toEqual(name)

    await Artist.destroy({
      where: {},
      cascade: true
    })

    await Upload.destroy({
      where: {},
      cascade: true
    })
  })
})

async function signIn(role: UserRole): Promise<{
  authenticationToken: string
  refreshToken: string
}> {
  await addUser(true, role)

  const {
    body: { nonce }
  } = await request(app)
    .post('/api/users/nonce')
    .send({
      publicAddress: user.publicAddress
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)

  const siweMessage = new SiweMessage({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    domain: config.frontendBaseUrl!.replace(/https?:\/\//, ''),
    address: user.publicAddress,
    statement: 'Sign in with Ethereum to the app.',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    uri: config.frontendBaseUrl!,
    version: '1',
    chainId: config.supportedChainId,
    nonce
  })

  const message = siweMessage.prepareMessage()

  const { signature } = web3.eth.accounts.sign(message, account.privateKey)

  const {
    body: { authenticationToken, refreshToken }
  } = await request(app)
    .post('/api/users/verify')
    .send({
      message,
      signature
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)

  return {
    authenticationToken,
    refreshToken
  }
}

async function addUser(
  active: boolean = true,
  role: UserRole = UserRole.USER
): Promise<void> {
  user = await User.create({
    publicAddress: web3.eth.defaultAccount,
    nonce: '',
    email: 'adam.smith@example.com',
    username: 'adam.smith89',
    name: 'Adam',
    surname: 'Smith',
    birthdate: '1989-02-21',
    role,
    active: active ? 1 : 0
  })
}

async function resetUsers(): Promise<void> {
  await User.destroy({
    where: {},
    cascade: true
  })
}
