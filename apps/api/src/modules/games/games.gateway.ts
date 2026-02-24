import type { Server, Socket } from 'socket.io'
import type { GameStateResponse } from './contracts/games.contract'
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
    @MessageBody() gameId: unknown,
  ): Promise<void> {
    const resolvedGameId = typeof gameId === 'string'
      ? gameId
      : Array.isArray(gameId) && gameId[0]
        ? gameId[0]
        : (gameId as { gameId?: string })?.gameId
    const idToUse = typeof resolvedGameId === 'string' ? resolvedGameId : undefined
    if (!idToUse) {
      this.logger.warn(`[WS] game:join ignored: no valid gameId`)
      return
    }

    await RequestContext.create(this.orm.em, async () => {
      try {
        await this.gamesService.getGame(idToUse)
      }
      catch (err) {
        this.logger.warn(`[WS] game:join ignored: game not found for id: ${idToUse}`, err instanceof Error ? err.message : String(err))
        return
      }

      const roomId = getGameRoomId(idToUse)
      client.join(roomId)

      const state = await this.gamesService.getGameState(idToUse)
      client.emit(GAME_STATE_EVENT, state)

      const socketsInRoom = await this.server.in(roomId).fetchSockets()
      this.logger.log(`[WS] Client joined room ${roomId}, ${socketsInRoom.length} socket(s) in room`)
    })
  }

  broadcastGameState(gameId: string, state: GameStateResponse): void {
    const roomId = getGameRoomId(gameId)
    this.server.in(roomId).fetchSockets().then((sockets) => {
      this.logger.log(`[WS] Broadcast game:state to room ${roomId}, ${sockets.length} socket(s) will receive`)
    })
    this.server.to(roomId).emit(GAME_STATE_EVENT, state)
  }
}
