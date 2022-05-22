// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get(
      '/statuses',
      {
        name: 'statuses',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const statuses = await app.objection.models.status.query();
        reply.render('statuses/index', { statuses });
        return reply;
      },
    )
    .get(
      '/statuses/new',
      {
        name: 'newStatus',
        preValidation: app.authenticate,
      },
      (req, reply) => {
        const status = new app.objection.models.status();
        reply.render('statuses/new', { status });
      },
    )
    .post(
      '/statuses',
      {
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const status = new app.objection.models.status();
        status.$set(req.body.data);

        try {
          const validStatus = await app.objection.models.status.fromJson(req.body.data);
          await app.objection.models.status.query().insert(validStatus);
          req.flash('info', i18next.t('flash.statuses.create.success'));
          reply.redirect(app.reverse('statuses'));
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.statuses.create.error'));
          reply.status(422);
          reply.render('statuses/new', { status, errors: data });
        }

        return reply;
      },
    )
    .get(
      '/statuses/:id/edit',
      {
        name: 'editStatus',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const status = await app.objection.models.status.query().findById(id);
        reply.render('statuses/edit', { status });
        return reply;
      },
    )
    .patch(
      '/statuses/:id',
      {
        name: 'patchStatus',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const { data } = req.body;
        try {
          const status = await app.objection.models.status.query().findById(id);
          await status.$query().update(data);
          req.flash('info', i18next.t('flash.statuses.update.success'));
          reply.status(302);
          reply.redirect(app.reverse('statuses'));
        } catch (error) {
          req.flash('error', i18next.t('flash.statuses.update.error'));
          reply.status(422);
          reply.render('statuses/edit', { status: { ...data, id }, errors: error.data });
        }
        return reply;
      },
    )
    .delete(
      '/statuses/:id',
      {
        name: 'deleteStatus',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        try {
          await app.objection.models.status.query().deleteById(id);
          req.flash('info', i18next.t('flash.statuses.delete.success'));
          reply.redirect(app.reverse('statuses'));
        } catch (error) {
          req.flash('error', i18next.t('flash.statuses.delete.error'));
          reply.status(422);
          reply.redirect(app.reverse('status'));
        }
        return reply;
      },
    );
};
