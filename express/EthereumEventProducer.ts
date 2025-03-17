import amqp from './rabbitmq.js'
import config from './config.js'
import {
  provider,
  web3,
  EthereumEventType,
  ethereumEvents
} from './utils/index.js'
import type { EthereumEvent } from './utils/interfaces.js'
import type { Channel } from 'amqplib'

declare global {
  interface BigInt {
    toJSON: () => string
  }
}

// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString()
}

class EthereumEventProducer {
  private readonly eventsList: EthereumEventType[]
  private readonly eventsSubscriptions: any[]

  private lastBlock: bigint

  private readonly queue: string
  private channel: null | Channel

  constructor() {
    this.eventsList = [
      EthereumEventType.NEW_BLOCK,
      EthereumEventType.TICKET_CREATED,
      EthereumEventType.TICKET_MINTED,
      EthereumEventType.TICKET_MODIFIED,
      EthereumEventType.TICKET_TRANSFERRED,
      EthereumEventType.TICKET_USED
    ]
    this.eventsSubscriptions = []

    this.lastBlock = 0n

    this.queue = 'ethereumEvents'
    this.channel = null

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.setupProducer().then(() => {
      console.log('=== Ethereum Event Producer setup successful ===')
    })
  }

  private async setupProducer(): Promise<void> {
    this.channel = await amqp.createChannel()

    for (const eventType of this.eventsList) {
      const eventSubscription = await this.subscribeEthereumEvent(eventType)
      this.eventsSubscriptions.push(eventSubscription)
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    provider!.on('connect', () => {
      console.log('=== Websocket connected ===')
      for (const eventSubscription of this.eventsSubscriptions) {
        eventSubscription.unsubscribe().then(() => {
          eventSubscription.subscribe()
        })
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    provider!.on('disconnect', (event: any) => {
      console.error(event)
      console.error('=== Websocket closed ===')
      process.exit(1)
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    provider!.on('error', (error: any) => {
      console.error(error)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      provider!.disconnect()
    })
  }

  private async subscribeEthereumEvent(
    eventType: EthereumEventType
  ): Promise<any> {
    let eventSubscription
    if (eventType === EthereumEventType.NEW_BLOCK) {
      eventSubscription = await web3.eth.subscribe('newHeads')
    } else {
      const { address, topics } = ethereumEvents[eventType]
      eventSubscription = await web3.eth.subscribe('logs', {
        address,
        topics
      })
    }

    eventSubscription.on('data', (data: any) => {
      const event: EthereumEvent = {
        type: eventType,
        data
      }
      if (!config.production || event.type !== EthereumEventType.NEW_BLOCK) {
        console.log(event)
      }

      if (eventType === EthereumEventType.NEW_BLOCK) {
        if (event.data.number - this.lastBlock > config.blockDistance) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.channel!.sendToQueue(
            this.queue,
            Buffer.from(JSON.stringify(event))
          )

          this.lastBlock = event.data.number
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.channel!.sendToQueue(
          this.queue,
          Buffer.from(JSON.stringify(event))
        )
      }
    })

    eventSubscription.on('error', (error: any) => {
      console.error(error)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      provider!.disconnect()
    })

    return eventSubscription
  }
}

// eslint-disable-next-line no-new
new EthereumEventProducer()
