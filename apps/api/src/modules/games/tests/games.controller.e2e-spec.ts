import supertest from 'supertest'
import {
  closeTestApp,
  initializeTestApp,
} from '../../../test/test.utils'
import { WORD_CATEGORY_SLUG, WordCategory } from '../../words/word-category.entity'
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

    const baseCategory = em.create(WordCategory, {
      slug: WORD_CATEGORY_SLUG.BASE,
      name: 'Mots de base',
    })
    const frCategory = em.create(WordCategory, {
      slug: WORD_CATEGORY_SLUG.MUSIC_ARTISTS_FR,
      name: 'Artistes FR',
    })
    const intlCategory = em.create(WordCategory, {
      slug: WORD_CATEGORY_SLUG.MUSIC_ARTISTS_INTL,
      name: 'Artistes intl',
    })
    await em.persistAndFlush([baseCategory, frCategory, intlCategory])

    const words = Array.from({ length: 25 }, (_, i) =>
      em.create(Word, { label: `Word${i}`, category: baseCategory }))
    const frWords = Array.from({ length: 30 }, (_, i) =>
      em.create(Word, { label: `FrArtist${i}`, category: frCategory }))
    const intlWords = Array.from({ length: 30 }, (_, i) =>
      em.create(Word, { label: `IntlArtist${i}`, category: intlCategory }))
    await em.persistAndFlush([...words, ...frWords, ...intlWords])
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
        isPublic: false,
        maxPlayers: 8,
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

    it('should not expose results to operators in game state', async () => {
      const operativeRes = await supertest(context.app.getHttpServer())
        .get(`/games/${highlightGameId}/state`)
        .set('X-Player-Id', redGuesserPlayerId)

      expect(operativeRes.status).toBe(200)
      expect(operativeRes.body.currentRound?.results).toBeUndefined()
      expect(operativeRes.body.currentRound?.wordsTotalBySide).toEqual({
        red: expect.any(Number),
        blue: expect.any(Number),
      })
      expect(operativeRes.body.currentRound?.wordsRemainingBySide).toEqual({
        red: expect.any(Number),
        blue: expect.any(Number),
      })
      expect(operativeRes.body.currentRound.wordsRemainingBySide.red).toBeGreaterThanOrEqual(0)
      expect(operativeRes.body.currentRound.wordsRemainingBySide.blue).toBeGreaterThanOrEqual(0)
    })

    it('should expose results to spymasters in game state', async () => {
      const spyRes = await supertest(context.app.getHttpServer())
        .get(`/games/${highlightGameId}/state`)
        .set('X-Player-Id', redSpyPlayerId)

      expect(spyRes.status).toBe(200)
      expect(spyRes.body.currentRound?.results).toBeDefined()
      expect(Array.isArray(spyRes.body.currentRound.results)).toBe(true)
    })
  })

  describe('Mid-game join and host team assignment', () => {
    let midGameId: string
    let midCreatorToken: string
    let midRedSpyId: string
    let midLateJoinerId: string

    beforeAll(async () => {
      const createRes = await supertest(context.app.getHttpServer())
        .post('/games')
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'MidHost', isPublic: true, maxPlayers: 6 })
      midCreatorToken = createRes.body.creatorToken
      midGameId = createRes.body.game.id
      midRedSpyId = createRes.body.playerId

      const joinBlue = await supertest(context.app.getHttpServer())
        .post(`/games/${midGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'MidBlueSpy' })
      const blueSpyId = joinBlue.body.playerId

      const joinRedG = await supertest(context.app.getHttpServer())
        .post(`/games/${midGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'MidRedG' })
      const redGuesserId = joinRedG.body.playerId

      await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/players/me/side`)
        .set('X-Player-Id', midRedSpyId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/players/me/side`)
        .set('X-Player-Id', blueSpyId)
        .set('Content-Type', 'application/json')
        .send({ side: 'blue' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/players/me/side`)
        .set('X-Player-Id', redGuesserId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/players/me/spy`)
        .set('X-Player-Id', midRedSpyId)

      await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/players/me/spy`)
        .set('X-Player-Id', blueSpyId)

      await supertest(context.app.getHttpServer())
        .post(`/games/${midGameId}/rounds/start`)
        .set('X-Player-Id', midRedSpyId)
        .set('Content-Type', 'application/json')
        .send({})

      const joinLate = await supertest(context.app.getHttpServer())
        .post(`/games/${midGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'LateJoiner' })
      expect(joinLate.status).toBe(201)
      expect(joinLate.body.playerId).toEqual(expect.any(String))
      midLateJoinerId = joinLate.body.playerId
    })

    it('should reject self-service choose side while a round is in progress', async () => {
      const res = await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/players/me/side`)
        .set('X-Player-Id', midLateJoinerId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      expect(res.status).toBe(400)
    })

    it('should assign a waiting player to a team when the creator provides a valid token', async () => {
      const res = await supertest(context.app.getHttpServer())
        .patch(`/games/${midGameId}/creator/players/${midLateJoinerId}/side`)
        .set('Content-Type', 'application/json')
        .send({ side: 'blue', creatorToken: midCreatorToken })

      expect(res.status).toBe(200)
      const late = res.body.players.find((p: { id: string }) => p.id === midLateJoinerId)
      expect(late?.side).toBe('blue')
      expect(Boolean(late?.isSpy)).toBe(false)
    })
  })

  describe('Word pack when starting a round', () => {
    let packGameId: string
    let packCreatorPlayerId: string
    let packBlueSpyId: string
    beforeAll(async () => {
      const createRes = await supertest(context.app.getHttpServer())
        .post('/games')
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'PackHost' })
      packGameId = createRes.body.game.id
      packCreatorPlayerId = createRes.body.playerId

      const joinBlue = await supertest(context.app.getHttpServer())
        .post(`/games/${packGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'PackBlueSpy' })
      packBlueSpyId = joinBlue.body.playerId

      const joinRedG = await supertest(context.app.getHttpServer())
        .post(`/games/${packGameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'PackRedG' })
      const redGuesserId = joinRedG.body.playerId

      await supertest(context.app.getHttpServer())
        .patch(`/games/${packGameId}/players/me/side`)
        .set('X-Player-Id', packCreatorPlayerId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${packGameId}/players/me/side`)
        .set('X-Player-Id', packBlueSpyId)
        .set('Content-Type', 'application/json')
        .send({ side: 'blue' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${packGameId}/players/me/side`)
        .set('X-Player-Id', redGuesserId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })

      await supertest(context.app.getHttpServer())
        .patch(`/games/${packGameId}/players/me/spy`)
        .set('X-Player-Id', packCreatorPlayerId)

      await supertest(context.app.getHttpServer())
        .patch(`/games/${packGameId}/players/me/spy`)
        .set('X-Player-Id', packBlueSpyId)
    })

    it('should start round with mixed artist word pack', async () => {
      const startRes = await supertest(context.app.getHttpServer())
        .post(`/games/${packGameId}/rounds/start`)
        .set('X-Player-Id', packCreatorPlayerId)
        .set('Content-Type', 'application/json')
        .send({ wordCategorySlug: WORD_CATEGORY_SLUG.MUSIC_ARTISTS_MIXED })

      expect(startRes.status).toBe(201)
      expect(startRes.body.currentRound?.words).toHaveLength(25)
      const labels: string[] = startRes.body.currentRound.words
      const fromFr = labels.filter((w: string) => w.startsWith('FrArtist'))
      const fromIntl = labels.filter((w: string) => w.startsWith('IntlArtist'))
      expect(fromFr.length).toBeGreaterThan(0)
      expect(fromIntl.length).toBeGreaterThan(0)
    })

    it('should reject invalid wordCategorySlug', async () => {
      const createRes = await supertest(context.app.getHttpServer())
        .post('/games')
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'BadSlugHost' })
      const gameId = createRes.body.game.id
      const playerId = createRes.body.playerId

      const join = await supertest(context.app.getHttpServer())
        .post(`/games/${gameId}/join`)
        .set('Content-Type', 'application/json')
        .send({ pseudo: 'BadSlugP2' })
      const p2 = join.body.playerId

      await supertest(context.app.getHttpServer())
        .patch(`/games/${gameId}/players/me/side`)
        .set('X-Player-Id', playerId)
        .set('Content-Type', 'application/json')
        .send({ side: 'red' })
      await supertest(context.app.getHttpServer())
        .patch(`/games/${gameId}/players/me/side`)
        .set('X-Player-Id', p2)
        .set('Content-Type', 'application/json')
        .send({ side: 'blue' })
      await supertest(context.app.getHttpServer())
        .patch(`/games/${gameId}/players/me/spy`)
        .set('X-Player-Id', playerId)
      await supertest(context.app.getHttpServer())
        .patch(`/games/${gameId}/players/me/spy`)
        .set('X-Player-Id', p2)

      const startRes = await supertest(context.app.getHttpServer())
        .post(`/games/${gameId}/rounds/start`)
        .set('X-Player-Id', playerId)
        .set('Content-Type', 'application/json')
        .send({ wordCategorySlug: 'not-a-real-pack' })

      expect(startRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  it('should list only public ongoing games', async () => {
    const privateRes = await supertest(context.app.getHttpServer())
      .post('/games')
      .set('Content-Type', 'application/json')
      .send({ pseudo: 'PrivateHost' })
    const publicRes = await supertest(context.app.getHttpServer())
      .post('/games')
      .set('Content-Type', 'application/json')
      .send({ pseudo: 'PublicHost', isPublic: true, maxPlayers: 7 })

    expect(privateRes.status).toBe(201)
    expect(publicRes.status).toBe(201)

    const listRes = await supertest(context.app.getHttpServer())
      .get('/games/public')

    expect(listRes.status).toBe(200)
    const publicIds = listRes.body.map((item: { id: string }) => item.id)
    expect(publicIds).toContain(publicRes.body.game.id)
    expect(publicIds).not.toContain(privateRes.body.game.id)
  })
})
