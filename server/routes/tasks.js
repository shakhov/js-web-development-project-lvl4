// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get(
      '/tasks',
      {
        name: 'tasks',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const tasks = await app.objection.models.task.query()
          .select(
            'tasks.*',
            'status.name as statusName',
            // FIXME join with virtual attribute 'fullName'
            'creator.firstName as creatorFirstName',
            'creator.lastName as creatorLastName',
            'executor.firstName as executorFirstName',
            'executor.lastName as executorLastName',
          )
          .joinRelated('[status, creator, executor]');
        reply.render('tasks/index', { tasks });
        return reply;
      },
    )
    .get(
      '/tasks/new',
      {
        name: 'newTask',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const task = new app.objection.models.task();
        const statuses = await app.objection.models.status.query().orderBy('name');
        const users = await app.objection.models.user.query().orderBy('first_name', 'last_name');
        reply.render('tasks/new', { task, statuses, users });

        return reply;
      },
    )
    .post(
      '/tasks',
      {
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const task = new app.objection.models.task();
        const reqData = req.body.data;

        const jsonData = {
          ...reqData,
          statusId: parseInt(reqData.statusId, 10),
          executorId: parseInt(reqData.executorId, 10),
          creatorId: req.user.id,
        };

        try {
          const validTask = await app.objection.models.task.fromJson(jsonData);
          await app.objection.models.task.query().insert(validTask);
          req.flash('info', i18next.t('flash.tasks.create.success'));
          reply.redirect(app.reverse('tasks'));
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.tasks.create.error'));
          reply.status(422);

          const statuses = await app.objection.models.status.query().orderBy('name');
          const users = await app.objection.models.user.query().orderBy('first_name', 'last_name');

          task.$set(jsonData);
          reply.render('tasks/new', {
            task, statuses, users, errors: data,
          });
        }

        return reply;
      },
    )
    .get(
      '/tasks/:id/edit',
      {
        name: 'editTask',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const task = await app.objection.models.task.query().findById(id);
        reply.render('tasks/edit', { task });
        return reply;
      },
    )
    .patch(
      '/tasks/:id',
      {
        name: 'patchTask',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const { data } = req.body;
        try {
          const task = await app.objection.models.task.query().findById(id);
          await task.$query().update(data);
          req.flash('info', i18next.t('flash.tasks.update.success'));
          reply.status(302);
          reply.redirect(app.reverse('tasks'));
        } catch (error) {
          req.flash('error', i18next.t('flash.tasks.update.error'));
          reply.status(422);
          reply.render('tasks/edit', { task: { ...data, id }, errors: error.data });
        }
        return reply;
      },
    )
    .delete(
      '/tasks/:id',
      {
        name: 'deleteTask',
        preValidation: [app.authenticate, app.authorizeDeleteTask],
      },
      async (req, reply) => {
        const { id } = req.params;
        try {
          await app.objection.models.task.query().deleteById(id);
          req.flash('info', i18next.t('flash.tasks.delete.success'));
          reply.redirect(app.reverse('tasks'));
        } catch (error) {
          req.flash('error', i18next.t('flash.tasks.delete.error'));
          reply.status(422);
          reply.redirect(app.reverse('task'));
        }
        return reply;
      },
    );
};