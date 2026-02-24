import supertest from 'supertest'
import {
  closeTestApp,
  initializeTestApp,
} from '../../../test/test.utils'
import { Word } from '../../words/words.entity'
import { GamesModule } from '../games.module'

describe('GamesController (e2e)', () => {
  let context: Awaited<ReturnType<typeof initializeTestApp>>
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

  describe('Phase 4: Highlight feature', () => {
    let redSpyPlayerId: string
    let redGuesserPlayerId: string
    let blueSpyPlayerId: string
    let highlightGameId: string

    beforeAll(async () => {
      const createRes = await supertest(context.app.getHttpServer())
        .post('/games')
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'RedSpy' })
      redSpyPlayerId = createRes.body.playerId
      highlightGameId = createRes.body.game.id

      const joinBob = await supertest(context.app.getHttpServer())
        .post(`/games/${highlightGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'BlueSpy' })
      blueSpyPlayerId = joinBob.body.playerId

      const joinCharlie = await supertest(context.app.getHttpServer())
        .post(`/games/${highlightGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'RedGuesser' })
      redGuesserPlayerId = joinCharlie.body.playerId

      await supertest(context.app.getHttpServer())
        .patch(`/games/${highlightGameId}/players/me/side`)
        .set('X-Player-Id', redSpyPlayerId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${highlightGameId}/players/me/side`)
        .set('X-Player-Id', blueSpyPlayerId)
        .set('Content-Type', 'application/json')
        .send({ side: 'blue' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${highlightGameId}/players/me/side`)
        .set('X-Player-Id', redGuesserPlayerId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${highlightGameId}/players/me/spy`)
        .set('X-Player-Id', redSpyPlayerId)

      await supertest(context.app.getHttpServer())
        .patch(`/games/${highlightGameId}/players/me/spy`)
        .set('X-Player-Id', blueSpyPlayerId)

      const startRes = await supertest(context.app.getHttpServer())
        .post(`/games/${highlightGameId}/rounds/start`)
        .set('X-Player-Id', redSpyPlayerId)
        .set('Content-Type', 'application/json')
        .send({})
      expect(startRes.status).toBe(201)
    })

    it('should allow guesser to highlight a word', async () => {
      const res = await supertest(context.app.getHttpServer())
        .post(`/games/${highlightGameId}/rounds/current/highlight`)
        .set('X-Player-Id', redGuesserPlayerId)
        .set('Content-Type', 'application/json')
        .send({ wordIndex: 0 })

      expect(res.status).toBe(201)
      expect(res.body.currentRound?.highlights?.['0']).toBeDefined()
      expect(res.body.currentRound.highlights['0']).toContainEqual(
        expect.objectContaining({ playerId: redGuesserPlayerId, playerName: 'RedGuesser' }),
      )
    })

    it('should allow guesser to unhighlight a word', async () => {
      const res = await supertest(context.app.getHttpServer())
        .delete(`/games/${highlightGameId}/rounds/current/highlight/0`)
        .set('X-Player-Id', redGuesserPlayerId)

      expect(res.status).toBe(200)
      expect(res.body.currentRound?.highlights?.['0']).toBeUndefined()
    })

    it('should deny spy to highlight a word', async () => {
      const res = await supertest(context.app.getHttpServer())
        .post(`/games/${highlightGameId}/rounds/current/highlight`)
        .set('X-Player-Id', redSpyPlayerId)
        .set('Content-Type', 'application/json')
        .send({ wordIndex: 1 })

      expect(res.status).toBe(403)
    })
  })
})
