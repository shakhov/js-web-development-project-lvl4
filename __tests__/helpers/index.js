// @ts-check
import { faker } from '@faker-js/faker';
import encrypt from '../../server/lib/secure.cjs';

const getFakeUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

const getFakeStatus = () => ({
  name: faker.word.adjective(),
});

export const prepareData = async (app) => {
  const { knex } = app.objection;

  const fakeUsersCount = 5;
  const fakeStatusesCount = 5;

  const fakeUsers = [];
  const fakeStatuses = [];

  for (let i = 0; i < fakeUsersCount; i += 1) {
    fakeUsers.push(getFakeUser());
  }

  for (let i = 0; i < fakeStatusesCount; i += 1) {
    fakeStatuses.push(getFakeStatus());
  }

  await knex('users').insert(fakeUsers.map(({
    firstName, lastName, email, password,
  }) => (
    {
      firstName,
      lastName,
      email,
      passwordDigest: encrypt(password),
    })));

  await knex('statuses').insert(fakeStatuses);

  return {
    users: {
      existing: fakeUsers,
      new: getFakeUser(),
    },
    statuses: {
      existing: fakeStatuses,
      new: getFakeStatus(),
    },
  };
};

export const getUserSession = async (app, userData) => {
  const responseSignIn = await app.inject({
    method: 'POST',
    url: app.reverse('session'),
    payload: {
      data: userData,
    },
  });

  // после успешной аутентификации получаем куки из ответа,
  // они понадобятся для выполнения запросов на маршруты требующие
  // предварительную аутентификацию
  const [sessionCookie] = responseSignIn.cookies;
  const { name, value } = sessionCookie;
  const cookies = { [name]: value };

  const signOut = async () => app.inject({
    method: 'DELETE',
    url: app.reverse('session'),
    // используем полученные ранее куки
    cookies,
  });

  return {
    cookies,
    signOut,
  };
};
