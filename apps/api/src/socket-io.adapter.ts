import { INestApplicationContext } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import type { ServerOptions } from 'socket.io'
import { config } from './config/env.config'

export class SocketIoAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app)
  }

  createIOServer(port: number, options?: ServerOptions): ReturnType<IoAdapter['createIOServer']> {
    const hasWildcard = config.cors.origins.includes('*')
    const corsOptions: { origin: string[]; credentials?: boolean } = {
      origin: config.cors.origins,
    }
    if (!hasWildcard)
      corsOptions.credentials = true

    return super.createIOServer(port, {
      ...options,
      cors: corsOptions,
    })
  }
}
