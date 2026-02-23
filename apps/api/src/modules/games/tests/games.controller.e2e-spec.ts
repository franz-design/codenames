import supertest from 'supertest'
import {
  closeTestApp,
  initializeTestApp,
} from '../../../test/test.utils'
import { Word } from '../../words/words.entity'
import { GamesModule } from '../games.module'

describe('GamesController (e2e)', () => {
  let context: Awaited<ReturnType<typeof initializeTestApp>>
  let creatorPlayerId: string
  let creatorToken: string
  let gameId: string

  beforeAll(async () => {
    context = await initializeTestApp({
      imports: [GamesModule],
      controllers: [],
    })

    const { orm } = context
    const em = orm.em.fork()

    const words = Array.from({ length: 25 }, (_, i) =>
      em.create(Word, { label: `Word${i}` }))
    await em.persistAndFlush(words)
  })

  afterAll(async () => {
    await closeTestApp(context)
  })

  it('should create game and return game info with creatorToken and playerId', async () => {
    const res = await supertest(context.app.getHttpServer())
      .post('/games')
      .set('Content-Type', 'application/json')
      .send({ pseudo: 'Alice' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      game: {
        id: expect.any(String),
        creatorPseudo: 'Alice',
      },
      creatorToken: expect.any(String),
      playerId: expect.any(String),
      gameState: expect.any(Object),
    })
    expect(res.body.game.createdAt).toBeDefined()
    expect(res.body.gameState.players).toHaveLength(1)
    expect(res.body.gameState.players[0].name).toBe('Alice')

    creatorPlayerId = res.body.playerId
    creatorToken = res.body.creatorToken
    gameId = res.body.game.id
  })

  it('should join game with pseudo and return playerId', async () => {
    const res = await supertest(context.app.getHttpServer())
      .post(`/games/${gameId}/join`)
      .set('Content-Type', 'application/json')
      .send({ pseudo: 'Bob' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      gameState: expect.any(Object),
      playerId: expect.any(String),
    })
    expect(res.body.gameState.players).toHaveLength(2)
    expect(res.body.gameState.players.map((p: { name: string }) => p.name)).toContain('Bob')
  })

  it('should kick player when creator provides valid creatorToken', async () => {
    const joinRes = await supertest(context.app.getHttpServer())
      .post(`/games/${gameId}/join`)
      .set('Content-Type', 'application/json')
      .send({ pseudo: 'ToKick' })

    const playerToKickId = joinRes.body.playerId

    const kickRes = await supertest(context.app.getHttpServer())
      .delete(`/games/${gameId}/players/${playerToKickId}`)
      .set('Content-Type', 'application/json')
      .send({ creatorToken })

    expect(kickRes.status).toBe(200)
    expect(kickRes.body.players.map((p: { name: string }) => p.name)).not.toContain('ToKick')
  })
})
