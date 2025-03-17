import amqp from './rabbitmq.js'
import config from './config.js'
import { Configuration } from './models/Configuration.js'
import { web3, EthereumEventType, ethereumEvents } from './utils/index.js'
import type { EthereumEvent } from './utils/interfaces.js'
import type { Channel } from 'amqplib'
import { performance } from 'perf_hooks'

class EthereumEventConsumer {
  private readonly eventsList: EthereumEventType[]

  private lastReviewedBlock: bigint

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

    this.lastReviewedBlock = 0n

    this.queue = 'ethereumEvents'
    this.channel = null

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.setupConsumer().then(() => {
      console.log('=== Ethereum Event Consumer setup successful ===')
    })
  }

  private async setupConsumer(): Promise<void> {
    const lastSyncedBlock = await Configuration.findOne({
      where: {
        name: 'lastSyncedBlock'
      }
    })

    if (lastSyncedBlock?.value != null) {
      this.lastReviewedBlock = BigInt(lastSyncedBlock.value)
    }

    this.channel = await amqp.createChannel()

    await this.channel.assertQueue(this.queue)

    await this.channel.consume(this.queue, (msg) => {
      const event =
        msg !== null
          ? (JSON.parse(msg.content.toString()) as EthereumEvent)
          : null
      if (event !== null) {
        if (!config.production || event.type !== EthereumEventType.NEW_BLOCK) {
          console.log(event)
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.consumerHandler(event).then(() => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.channel!.ack(msg!)
        })
      }
    })
  }

  private async consumerHandler(event: EthereumEvent): Promise<void> {
    performance.mark('ethereum-event-consumer-start')

    if (event.type === EthereumEventType.NEW_BLOCK) {
      const safeBlock = await web3.eth.getBlock('finalized', false)
      const toBlock = safeBlock.number

      const lastSyncedBlock = await Configuration.findOne({
        where: {
          name: 'lastSyncedBlock'
        }
      })

      if (lastSyncedBlock?.value != null) {
        this.lastReviewedBlock = BigInt(lastSyncedBlock.value)
      }

      if (toBlock > this.lastReviewedBlock) {
        for (const eventType of this.eventsList) {
          if (eventType === EthereumEventType.NEW_BLOCK) {
            continue
          }

          await this.processEthereumPastEvents(
            eventType,
            this.lastReviewedBlock + 1n,
            toBlock
          )
        }

        this.lastReviewedBlock = toBlock
        await Configuration.upsert({
          name: 'lastSyncedBlock',
          value: this.lastReviewedBlock.toString()
        })
      }
    } else if (config.production) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await ethereumEvents[event.type].handleEvent!(event.data)
      } catch (error) {
        console.error(error)
      }
    }

    performance.mark('ethereum-event-consumer-end')
    if (!config.production || event.type !== EthereumEventType.NEW_BLOCK) {
      performance.measure(
        'EthereumEventConsumer',
        'ethereum-event-consumer-start',
        'ethereum-event-consumer-end'
      )
    }
  }

  private async processEthereumPastEvents(
    eventType: EthereumEventType,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<any> {
    const { address, topics } = ethereumEvents[eventType]

    const pastEvents = await web3.eth.getPastLogs({
      address,
      topics,
      fromBlock,
      toBlock
    })

    pastEvents.sort((a: any, b: any) => {
      const blockNumberDiff = (a.blockNumber -
        b.blockNumber) as unknown as bigint
      const logIndexDiff = (a.logIndex - b.logIndex) as unknown as bigint

      if (blockNumberDiff !== 0n) {
        return blockNumberDiff < 0n ? -1 : 1
      } else {
        return logIndexDiff < 0n ? -1 : 1
      }
    })

    for (const event of pastEvents) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await ethereumEvents[eventType].handleEvent!(event, true)
      } catch (error) {
        console.error(error)
      }
    }
  }
}

// eslint-disable-next-line no-new
new EthereumEventConsumer()
