// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);

      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.users.create.success'));
        await req.logIn(validUser);
        reply.redirect(app.reverse('root'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.status(422);
        reply.render('users/new', { user, errors: data });
      }

      return reply;
    })
    .get(
      '/users/:id/edit',
      {
        name: 'editUser',
        preValidation: [app.authenticate, app.authorizeEditUser],
      },
      async (req, reply) => {
        const { id } = req.params;
        const user = await app.objection.models.user.query().findById(id);
        reply.render('users/edit', { user });
        return reply;
      },
    )
    .patch(
      '/users/:id',
      {
        name: 'patchUser',
        preValidation: [app.authenticate, app.authorizeEditUser],
      },
      async (req, reply) => {
        const { id } = req.params;
        const { data } = req.body;
        try {
          const user = await app.objection.models.user.query().findById(id);
          await user.$query().update(data);
          req.flash('info', i18next.t('flash.users.update.success'));
          reply.status(302);
          reply.redirect(app.reverse('users'));
        } catch (error) {
          req.flash('error', i18next.t('flash.users.update.error'));
          reply.status(422);
          reply.render('users/edit', { user: { ...data, id }, errors: error.data });
        }
        return reply;
      },
    )
    .delete(
      '/users/:id',
      {
        name: 'deleteUser',
        preValidation: [app.authenticate, app.authorizeEditUser],
      },
      async (req, reply) => {
        const { id } = req.params;
        try {
          const taskCount = await app.objection.models.task
            .query()
            .where('creatorId', '=', id)
            .orWhere('executorId', '=', id)
            .resultSize();

          if (taskCount > 0) {
            req.flash('error', i18next.t('flash.users.delete.error'));
            reply.status(302);
            reply.redirect(app.reverse('users'));
            return reply;
          }

          await app.objection.models.user.query().deleteById(id);
          req.flash('info', i18next.t('flash.users.delete.success'));
          req.logOut();
          reply.redirect(app.reverse('root'));
        } catch (error) {
          req.flash('error', i18next.t('flash.users.delete.error'));
          reply.status(302);
          reply.redirect(app.reverse('users'));
        }
        return reply;
      },
    );
};
