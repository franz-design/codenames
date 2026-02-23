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
import { fromNodeHeaders } from 'better-auth/node'
import type { GameStateResponse } from './contracts/games.contract'
import { AuthService } from '../auth/auth.service'
import { GamesService } from './games.service'

const GAME_STATE_EVENT = 'game:state'
const GAME_JOIN_EVENT = 'game:join'

function getGameRoomId(gameId: string): string {
  return `game:${gameId}`
}

export interface AuthenticatedSocket extends Socket {
  userId?: string
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/games',
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly authService: AuthService,
    private readonly gamesService: GamesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const session = await this.authService.api.getSession({
        headers: fromNodeHeaders(client.handshake.headers),
      })

      if (!session?.user?.id) {
        client.disconnect()
        return
      }

      client.userId = session.user.id
    }
    catch {
      client.disconnect()
    }
  }

  handleDisconnect(_client: AuthenticatedSocket): void {
    // Cleanup if needed
  }

  @SubscribeMessage(GAME_JOIN_EVENT)
  async handleGameJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() gameId: string,
  ): Promise<void> {
    const userId = client.userId
    if (!userId || typeof gameId !== 'string')
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
