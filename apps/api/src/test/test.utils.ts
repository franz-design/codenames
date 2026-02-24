// TEST UTILS
//
// All test data creation must use factories in src/test/factories/ as per CURSOR_TEST_IMPROVEMENT_PROMPT.md.
// These helpers are for app setup/teardown and request helpers only.
// Arrange-Act-Assert pattern should be followed in all test files.

import type { TestingModule } from '@nestjs/testing'
import { ZodSerializationExceptionFilter, ZodValidationExceptionFilter } from '@lonestone/nzoth/server'
import { MikroORM } from '@mikro-orm/core'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { INestApplication, ModuleMetadata } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { json } from 'express'
import * as express from 'express'
import supertest from 'supertest'
import { createTestMikroOrmOptions } from '../config/mikro-orm.config'

let postgresContainer: StartedPostgreSqlContainer

export interface TestAppContext {
  app: INestApplication
  orm: MikroORM
  moduleFixture: TestingModule
}

/**
 * Initializes a NestJS application for testing
 * @param metadata The metadata for the test module
 * @returns An object containing the app, ORM, and test module
 */
interface GuardOverride { guard: unknown, useValue: unknown }

interface InitializeOptions {
  overrideGuards?: GuardOverride[]
}

export async function initializeTestApp(
  metadata: ModuleMetadata & InitializeOptions,
): Promise<TestAppContext> {
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine').start()

  const mikroOrmOptions = createTestMikroOrmOptions({
    allowGlobalContext: true,
    dbName: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    user: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
  })

  const orm = await MikroORM.init(mikroOrmOptions)

  await orm.schema.refreshDatabase()

  const moduleBuilder = Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot(mikroOrmOptions),
      ...(metadata.imports ?? []),
    ],
    controllers: [...(metadata.controllers ?? [])],
  })

  if (metadata.overrideGuards?.length) {
    for (const override of metadata.overrideGuards) {
      moduleBuilder.overrideGuard(override.guard).useValue(override.useValue)
    }
  }

  if (metadata.providers) {
    for (const provider of metadata.providers) {
      if (provider && typeof provider === 'object' && 'provide' in provider && 'useValue' in provider) {
        moduleBuilder.overrideProvider(provider.provide).useValue(provider.useValue)
      }
    }
  }

  const moduleFixture = await moduleBuilder.compile()

  const app = moduleFixture.createNestApplication({
    bodyParser: false,
  })

  app.useGlobalFilters(
    new ZodValidationExceptionFilter(),
    new ZodSerializationExceptionFilter(),
  )

  app.use(json({ limit: '50mb' }))
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.originalUrl.startsWith('stripe/webhook')) {
        return next()
      }
      express.json()(req, res, next)
    },
  )
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  await app.init()

  return { app, orm, moduleFixture }
}

export function initRequestWithPlayerId(app: INestApplication, playerId: string) {
  return (method: 'get' | 'post' | 'put' | 'del' | 'patch', url: string) => {
    return supertest(app.getHttpServer())[method](url).set('X-Player-Id', playerId)
  }
}

/**
 * Closes the app and ORM
 * @param context The test app context
 */
export async function closeTestApp(context: TestAppContext): Promise<void> {
  await context.app.close()
  await context.orm.close(true)
  await postgresContainer.stop()
}
