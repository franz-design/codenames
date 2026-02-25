import type { Server, Socket } from 'socket.io'
import { MikroORM, RequestContext } from '@mikro-orm/core'
import {
  forwardRef,
  Inject,
  Logger,
} from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { GamesService } from './games.service'

const GAME_STATE_EVENT = 'game:state'
const GAME_JOIN_EVENT = 'game:join'
const GAME_TIMELINE_ITEM_EVENT = 'game:timeline-item'

function getGameRoomId(gameId: string): string {
  return `game:${gameId}`
}

@WebSocketGateway({
  namespace: '/games',
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GamesGateway.name)

  @WebSocketServer()
  server!: Server

  constructor(
    // eslint-disable-next-line react/no-forward-ref, react/no-useless-forward-ref
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    private readonly orm: MikroORM,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`[WS] Client connected to /games namespace, id: ${client.id}`)
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`[WS] Client disconnected from /games, id: ${client.id}`)
  }

  @SubscribeMessage(GAME_JOIN_EVENT)
  async handleGameJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const { gameId: resolvedGameId, playerId } = this.parseGameJoinPayload(payload)
    if (!resolvedGameId) {
      this.logger.warn(`[WS] game:join ignored: no valid gameId`)
      return
    }

    client.data.playerId = playerId

    await RequestContext.create(this.orm.em, async () => {
      try {
        await this.gamesService.getGame(resolvedGameId)
      }
      catch (err) {
        this.logger.warn(`[WS] game:join ignored: game not found for id: ${resolvedGameId}`, err instanceof Error ? err.message : String(err))
        return
      }

      const roomId = getGameRoomId(resolvedGameId)
      client.join(roomId)

      const state = await this.gamesService.getGameState(resolvedGameId, playerId)
      client.emit(GAME_STATE_EVENT, state)

      const socketsInRoom = await this.server.in(roomId).fetchSockets()
      this.logger.log(`[WS] Client joined room ${roomId}, ${socketsInRoom.length} socket(s) in room`)
    })
  }

  private parseGameJoinPayload(payload: unknown): { gameId: string | undefined, playerId: string | undefined } {
    if (typeof payload === 'string')
      return { gameId: payload, playerId: undefined }
    if (Array.isArray(payload) && payload[0])
      return { gameId: String(payload[0]), playerId: undefined }
    const obj = payload as { gameId?: string, playerId?: string } | undefined
    if (obj?.gameId)
      return { gameId: obj.gameId, playerId: obj.playerId }
    return { gameId: undefined, playerId: undefined }
  }

  async broadcastGameState(gameId: string): Promise<void> {
    const roomId = getGameRoomId(gameId)
    const sockets = await this.server.in(roomId).fetchSockets()
    for (const socket of sockets) {
      const playerId = socket.data.playerId as string | undefined
      const state = await this.gamesService.getGameState(gameId, playerId)
      socket.emit(GAME_STATE_EVENT, state)
    }
    this.logger.log(`[WS] Broadcast game:state to room ${roomId}, ${sockets.length} socket(s) received personalized state`)
  }

  async broadcastTimelineItem(
    gameId: string,
    item: { id: string, type: 'event' | 'chat', eventType?: string, payload: Record<string, unknown>, triggeredBy: string | null, playerName?: string, createdAt: string },
  ): Promise<void> {
    const roomId = getGameRoomId(gameId)
    const sockets = await this.server.in(roomId).fetchSockets()
    for (const socket of sockets) {
      socket.emit(GAME_TIMELINE_ITEM_EVENT, item)
    }
    this.logger.log(`[WS] Broadcast game:timeline-item to room ${roomId}, ${sockets.length} socket(s)`)
  }
}
