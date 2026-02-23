import {
  forwardRef,
  Inject,
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
import type { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import type { GameStateResponse } from './contracts/games.contract'
import { GamesService } from './games.service'

const GAME_STATE_EVENT = 'game:state'
const GAME_JOIN_EVENT = 'game:join'

function getGameRoomId(gameId: string): string {
  return `game:${gameId}`
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/games',
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
  ) {}

  handleConnection(_client: Socket): void {
    // No auth required - anyone can connect
  }

  handleDisconnect(_client: Socket): void {
    // Cleanup if needed
  }

  @SubscribeMessage(GAME_JOIN_EVENT)
  async handleGameJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameId: string,
  ): Promise<void> {
    if (typeof gameId !== 'string')
      return

    try {
      await this.gamesService.getGame(gameId)
    }
    catch {
      return
    }

    client.join(getGameRoomId(gameId))
  }

  broadcastGameState(gameId: string, state: GameStateResponse): void {
    this.server.to(getGameRoomId(gameId)).emit(GAME_STATE_EVENT, state)
  }
}
