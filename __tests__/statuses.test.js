import fastify from 'fastify';
import init from '../server/plugin.js';
import { prepareData, getUserSession } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let testData;
  let session;

  beforeAll(async () => {
    app = fastify();
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;
    await knex.migrate.latest();
    testData = await prepareData(app);
  });

  beforeEach(async () => {
    // await knex.migrate.latest();
    session = await getUserSession(app, testData.users.existing[0]);
  });

  afterEach(async () => {
    // await knex.migrate.rollback();
    await session.signOut();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('test statuses create', () => {
    it('new status page access fail: no auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newStatus'),
      });

      expect(response.statusCode).toBe(302);
    });

    it('new status page access success', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newStatus'),
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('new status fail: no auth', async () => {
      const params = testData.statuses.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('statuses'),
        payload: {
          data: params,
        },
      });

      expect(response.statusCode).toBe(302);
    });

    it('new status success', async () => {
      const beforeCount = await models.status.query().resultSize();
      const params = testData.statuses.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('statuses'),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = params;
      const status = await models.status.query().findOne({ name: params.name });
      const afterCount = await models.status.query().resultSize();
      expect(status).toMatchObject(expected);
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('new status fail: existing', async () => {
      const beforeCount = await models.status.query().resultSize();
      const params = testData.statuses.existing[0];
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('statuses'),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(422);

      const afterCount = await models.status.query().resultSize();
      expect(afterCount).toBe(beforeCount);
    });

    it('new status fail: empty name', async () => {
      const beforeCount = await models.status.query().resultSize();
      const params = { name: '' };
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('statuses'),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(422);

      const afterCount = await models.status.query().resultSize();
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('test read statuses', () => {
    it('read statuses fail: no auth', async () => {
      const responseGuest = await app.inject({
        method: 'GET',
        url: app.reverse('statuses'),
      });

      expect(responseGuest.statusCode).toBe(302);
    });

    it('read statuses success', async () => {
      const responseSignedIn = await app.inject({
        method: 'GET',
        url: app.reverse('statuses'),
        cookies: session.cookies,
      });

      expect(responseSignedIn.statusCode).toBe(200);
    });
  });

  describe('test update statuses', () => {
    it('edit status page access success', async () => {
      const existing = testData.statuses.existing[0];
      const status = await models.status.query().findOne({ name: existing.name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editStatus', { id: status.id }),
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('edit status page access fail: no auth', async () => {
      const existing = testData.statuses.existing[0];
      const status = await models.status.query().findOne({ name: existing.name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editStatus', { id: status.id }),
      });

      expect(response.statusCode).toBe(302);
    });

    it('edit status page access fail: wrong id', async () => {
      const existing = testData.statuses.existing[0];
      const status = await models.status.query().findOne({ name: existing.name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editStatus', { id: status.id * 100 }),
      });

      expect(response.statusCode).toBe(302);
    });

    it('update status fail: no auth', async () => {
      const existing = testData.statuses.existing[0];
      const existingStatus = await models.status.query().findOne({ name: existing.name });
      const params = { name: 'NEW NAME' };
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchStatus', { id: existingStatus.id }),
        payload: {
          data: params,
        },
      });

      expect(response.statusCode).toBe(302);

      const newStatus = await models.status.query().findOne({ name: params.name });
      expect(newStatus).toBeUndefined();
    });

    it('update status fail: empty name', async () => {
      const existing = testData.statuses.existing[0];
      const existingStatus = await models.status.query().findOne({ name: existing.name });
      const params = { name: '' };
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchStatus', { id: existingStatus.id }),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(422);

      const newStatus = await models.status.query().findOne({ name: params.name });
      const oldStatus = await models.status.query().findOne({ name: existingStatus.name });
      expect(newStatus).toBeUndefined();
      expect(oldStatus).toMatchObject(existingStatus);
    });

    it('update status fail: wrong id', async () => {
      const existing = testData.statuses.existing[0];
      const existingStatus = await models.status.query().findOne({ name: existing.name });
      const params = { name: 'NEW NAME' };
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchStatus', { id: existingStatus.id * 100 }),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(422);

      const newStatus = await models.status.query().findOne({ name: params.name });
      const oldStatus = await models.status.query().findOne({ name: existingStatus.name });
      expect(newStatus).toBeUndefined();
      expect(oldStatus).toMatchObject(existingStatus);
    });

    it('update status success', async () => {
      const existing = testData.statuses.existing[0];
      const existingStatus = await models.status.query().findOne({ name: existing.name });
      const params = { name: 'NEW NAME' };
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchStatus', { id: existingStatus.id }),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = params;
      const newStatus = await models.status.query().findOne({ name: params.name });
      expect(newStatus).toMatchObject(expected);
    });

    it('update status fail: existing name', async () => {
      const existing = testData.statuses.existing[1];
      const existingStatus = await models.status.query().findOne({ name: existing.name });
      const params = { name: 'NEW NAME' };
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchStatus', { id: existingStatus.id }),
        payload: {
          data: params,
        },
        cookies: session.cookies,
      });

      expect(response.statusCode).toBe(422);
    });
  });
});
