import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    // Load test environment variables first
    dotenv.config({ path: '.env.test' });

    // Run migrations in the in-memory DB
    execSync(
      'npx prisma migrate deploy --schema=src/common/prisma/schema.prisma',
      {
        stdio: 'inherit',
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const user = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('should SIGNUP a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(201);

    expect(res.body.email).toBe(user.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should not SIGNUP with existing email', async () => {
    // create user first
    await request(app.getHttpServer()).post('/auth/signup').send(user);

    // try to create again with same email
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(403);

    expect(res.body.message).toBe('Email address already exists');
  });

  it('should LOGIN with correct credentials', async () => {
    // create user first
    await request(app.getHttpServer()).post('/auth/signup').send(user);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(user.email);
  });

  it('should not LOGIN with incorrect credentials', async () => {
    // create user first
    await request(app.getHttpServer()).post('/auth/signup').send(user);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password + 'random' })
      .expect(401);

    expect(res.body.message).toBe('Incorrect Credentials');
  });
});
