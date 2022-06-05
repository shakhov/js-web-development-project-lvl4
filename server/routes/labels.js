// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get(
      '/labels',
      {
        name: 'labels',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const labels = await app.objection.models.label.query();
        reply.render('labels/index', { labels });
        return reply;
      },
    )
    .get(
      '/labels/new',
      {
        name: 'newLabel',
        preValidation: app.authenticate,
      },
      (req, reply) => {
        const label = new app.objection.models.label();
        reply.render('labels/new', { label });
      },
    )
    .post(
      '/labels',
      {
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const label = new app.objection.models.label();
        label.$set(req.body.data);

        try {
          const validLabel = await app.objection.models.label.fromJson(req.body.data);
          await app.objection.models.label.query().insert(validLabel);
          req.flash('info', i18next.t('flash.labels.create.success'));
          reply.redirect(app.reverse('labels'));
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.labels.create.error'));
          reply.status(422);
          reply.render('labels/new', { label, errors: data });
        }

        return reply;
      },
    )
    .get(
      '/labels/:id/edit',
      {
        name: 'editLabel',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const label = await app.objection.models.label.query().findById(id);
        reply.render('labels/edit', { label });
        return reply;
      },
    )
    .patch(
      '/labels/:id',
      {
        name: 'patchLabel',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const { data } = req.body;
        try {
          const label = await app.objection.models.label.query().findById(id);
          await label.$query().update(data);
          req.flash('info', i18next.t('flash.labels.update.success'));
          reply.status(302);
          reply.redirect(app.reverse('labels'));
        } catch (error) {
          req.flash('error', i18next.t('flash.labels.update.error'));
          reply.status(422);
          reply.render('labels/edit', { label: { ...data, id }, errors: error.data });
        }
        return reply;
      },
    )
    .delete(
      '/labels/:id',
      {
        name: 'deleteLabel',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;

        try {
          // const taskCount = await app.objection.models.task
          //   .query()
          //   .where('labelId', '=', id)
          //   .resultSize();

          // if (taskCount > 0) {
          //   req.flash('error', i18next.t('flash.labels.delete.error'));
          //   reply.status(302);
          //   reply.redirect(app.reverse('labels'));
          //   return reply;
          // }

          await app.objection.models.label.query().deleteById(id);
          req.flash('info', i18next.t('flash.labels.delete.success'));
          reply.redirect(app.reverse('labels'));
        } catch (error) {
          req.flash('error', i18next.t('flash.labels.delete.error'));
          reply.status(302);
          reply.redirect(app.reverse('labels'));
        }
        return reply;
      },
    );
};
