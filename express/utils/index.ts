import { Web3, WebSocketProvider } from 'web3'
import type { AbiParameter, DecodedParams } from 'web3'
import config from '../config.js'
import sequelize from '../sequelize.js'
import redis from '../redis.js'
import { initModels } from '../models/init-models.js'
import { PerformanceObserver } from 'perf_hooks'
import { Event } from '../models/Event.js'
import { Ticket } from '../models/Ticket.js'
import type { RedisJSON } from '@redis/json/dist/commands/index.js'

const perfObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(
      `Performance Observer: Name: "${entry.name}"; Duration: ${entry.duration}ms`
    )
  })
})

perfObserver.observe({ entryTypes: ['measure'] })

export enum TokenType {
  SIGN_UP,
  ACTIVATION,
  AUTHENTICATION,
  REFRESH
}

export async function redisJsonSet(
  key: string,
  value: RedisJSON
): Promise<void> {
  await redis.json.set(key, '$', value)
  await redis.expire(key, config.redis.expire)
}

export async function redisJsonMerge(
  key: string,
  value: RedisJSON
): Promise<void> {
  await redis.json.merge(key, '$', value)
  await redis.expire(key, config.redis.blockchainExpire)
}

export const models = initModels(sequelize)

export const provider = !config.test
  ? new WebSocketProvider(
      config.web3Provider.provider ?? '',
      {},
      {
        delay: 500,
        autoReconnect: true,
        maxAttempts: 10
      }
    )
  : undefined

if (!config.test) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  provider!.on('connect', () => {
    console.log('=== Websocket connected ===')
  })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  provider!.on('disconnect', (event: any) => {
    console.log(event)
    console.log('=== Websocket closed ===')
  })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  provider!.on('error', (error: any) => {
    console.error(error)
  })
}

export const web3 = new Web3(provider)

const privateKey: string = config.web3Provider.privateKey ?? ''
export const account = web3.eth.accounts.privateKeyToAccount(privateKey)
web3.eth.accounts.wallet.add(account)
web3.eth.defaultAccount = account.address

export enum EthereumEventType {
  NEW_BLOCK,
  TICKET_CREATED,
  TICKET_MINTED,
  TICKET_TRANSFERRED,
  TICKET_MODIFIED,
  TICKET_USED
}

export const ethereumEvents: Record<
  EthereumEventType,
  {
    address?: string
    topics?: string[]
    inputs?: AbiParameter[]
    handleEvent?: (event: any, persistent?: boolean) => Promise<void>
  }
> = {
  [EthereumEventType.NEW_BLOCK]: {},
  [EthereumEventType.TICKET_CREATED]: {
    address: config.smartContracts.ticketFactoryAddress,
    topics: [
      '0xe525d86493e733de191e67c16848421ca3921dfbc28a621395da9e147f77a99e'
    ],
    handleEvent: eventHandler(
      [
        {
          indexed: false,
          internalType: 'int32',
          name: 'idEvent',
          type: 'int32'
        },
        {
          indexed: false,
          internalType: 'contract Ticket',
          name: 'ticket',
          type: 'address'
        }
      ],
      async (event: any, decodedParams: DecodedParams, persistent: boolean) => {
        const contractAddress = decodedParams.ticket as string
        const idEvent = decodedParams.idEvent as number
        const key = `Event::${idEvent}`
        if (persistent) {
          await Event.update(
            {
              contractAddress
            },
            {
              where: {
                idEvent
              }
            }
          )
          await redis.del(key)
        } else {
          if (event.removed as boolean) {
            await redis.del(key)
            return
          }

          await redisJsonMerge(key, { contractAddress })
        }
      }
    )
  },
  [EthereumEventType.TICKET_MINTED]: {
    address: config.smartContracts.ticketHandlerAddress,
    topics: [
      '0x900711f279e71608b3aa7a546fe86720f3dcd10dddc41e951b94ae329ffb0e14'
    ],
    handleEvent: eventHandler(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'ticket',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'price',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        }
      ],
      async (event: any, decodedParams: DecodedParams, persistent: boolean) => {
        const ticketAddress = decodedParams.ticket as string
        const userAddress = decodedParams.owner as string
        const price = decodedParams.price as number
        const tokenId = decodedParams.tokenId as number
        const key = `Tickets::${userAddress}`
        if (persistent) {
          await Ticket.create({
            ticketAddress,
            userAddress,
            tokenId,
            price
          })
          await redis.json.del(key, `$.${ticketAddress}::${tokenId}`)
        } else {
          if (event.removed as boolean) {
            await redis.json.del(key, `$.${ticketAddress}::${tokenId}`)
            return
          }

          await redisJsonMerge(key, {
            [`${ticketAddress}::${tokenId}`]: {
              idTicket: null,
              tokenId: Number(tokenId),
              ticketAddress,
              userAddress,
              price: price.toString(),
              created: new Date(),
              used: 0
            }
          })
        }
      }
    )
  },
  [EthereumEventType.TICKET_TRANSFERRED]: {
    address: config.smartContracts.ticketHandlerAddress,
    topics: [
      '0x19fbcfbe394d5025064110e984db6d98874750f4d112c973e1a73e27cd096088'
    ],
    handleEvent: eventHandler(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'ticket',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        }
      ],
      async (event: any, decodedParams: DecodedParams, persistent: boolean) => {
        const ticketAddress = decodedParams.ticket as string
        const from = decodedParams.from as string
        const to = decodedParams.to as string
        const tokenId = decodedParams.tokenId as number
        const ticketKey = `Ticket::${ticketAddress}::${tokenId}`
        const toKey = `Tickets::${to}`
        if (persistent) {
          await Ticket.update(
            {
              userAddress: to
            },
            {
              where: {
                ticketAddress,
                userAddress: from,
                tokenId
              }
            }
          )
          await redis.del(ticketKey)
          await redis.json.del(toKey, `$.${ticketAddress}::${tokenId}`)
        } else {
          if (event.removed as boolean) {
            await redis.del(ticketKey)
            await redis.json.del(toKey, `$.${ticketAddress}::${tokenId}`)
            return
          }

          await redisJsonMerge(ticketKey, { userAddress: to })
          await redisJsonMerge(toKey, {
            [`${ticketAddress}::${tokenId}`]: {
              idTicket: null,
              tokenId: Number(tokenId),
              ticketAddress,
              userAddress: to
            }
          })
        }
      }
    )
  },
  [EthereumEventType.TICKET_MODIFIED]: {
    address: config.smartContracts.ticketHandlerAddress,
    topics: [
      '0x1ad47dd562b1eb0676cd8c69c1f155ff859f211f8fa5371de9950d7e9572a028'
    ],
    handleEvent: eventHandler(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'ticket',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'maxSupply',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'price',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'maxTokensPerWallet',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'publish',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'transferable',
          type: 'bool'
        }
      ],
      async (event: any, decodedParams: DecodedParams, persistent: boolean) => {
        const contractAddress = decodedParams.ticket as string
        const ticketCount = decodedParams.maxSupply as number
        const ticketPrice = decodedParams.price as number
        const maxTicketsPerUser = decodedParams.maxTokensPerWallet as number
        const publish = new Date(Number(decodedParams.publish) * 1000)
        const transferable = decodedParams.transferable as boolean

        const foundEvent = await Event.findOne({
          attributes: ['idEvent'],
          where: {
            contractAddress
          }
        })

        if (foundEvent === null) {
          return
        }

        const idEvent = foundEvent.idEvent
        const key = `Event::${idEvent}`
        if (persistent) {
          await Event.update(
            {
              ticketCount,
              ticketPrice,
              maxTicketsPerUser,
              publish,
              transferable: transferable ? 1 : 0
            },
            {
              where: {
                contractAddress
              }
            }
          )
          await redis.del(key)
        } else {
          if (event.removed as boolean) {
            await redis.del(key)
            return
          }

          await redisJsonMerge(key, {
            ticketCount: Number(ticketCount),
            ticketPrice: ticketPrice.toString(),
            maxTicketsPerUser: Number(maxTicketsPerUser),
            publish,
            transferable: transferable ? 1 : 0
          })
        }
      }
    )
  },
  [EthereumEventType.TICKET_USED]: {
    address: config.smartContracts.ticketHandlerAddress,
    topics: [
      '0xda2f464d6e37ab1cbafd722feb688d643944ccd6493bbd3be178204b193e6179'
    ],
    handleEvent: eventHandler(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'ticket',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'used',
          type: 'bool'
        }
      ],
      async (event: any, decodedParams: DecodedParams, persistent: boolean) => {
        const ticketAddress = decodedParams.ticket as string
        const tokenId = decodedParams.tokenId as number
        const used = decodedParams.used as boolean
        const key = `Ticket::${ticketAddress}::${tokenId}`
        if (persistent) {
          await Ticket.update(
            {
              used: used ? 1 : 0
            },
            {
              where: {
                ticketAddress,
                tokenId
              }
            }
          )
          await redis.del(key)
        } else {
          if (event.removed as boolean) {
            await redis.del(key)
            return
          }

          await redisJsonMerge(key, { used: used ? 1 : 0 })
        }
      }
    )
  }
}

function eventHandler(
  inputs: AbiParameter[],
  callback: (
    event: any,
    decodedParams: DecodedParams,
    persistent: boolean
  ) => Promise<void>
) {
  return async (event: any, persistent: boolean = false) => {
    const internalData: string = event.data
    const topics: string[] = event.topics
    const decodedParams = web3.eth.abi.decodeLog(inputs, internalData, topics)
    await callback(event, decodedParams, persistent)
  }
}
