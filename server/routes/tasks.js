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
          .leftJoinRelated('[status, creator, executor]');
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
        const {
          name, description, statusId, executorId,
        } = req.body.data;

        const jsonData = {
          name,
          description,
          statusId: parseInt(statusId, 10),
          creatorId: req.user.id,
        };

        if (executorId !== '') {
          jsonData.executorId = parseInt(executorId, 10);
        }

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
      '/tasks/:id',
      {
        name: 'viewTask',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const { id } = req.params;
        const task = await app.objection.models.task.query().findById(id)
          .select(
            'tasks.*',
            'status.name as statusName',
            // FIXME join with virtual attribute 'fullName'
            'creator.firstName as creatorFirstName',
            'creator.lastName as creatorLastName',
            'executor.firstName as executorFirstName',
            'executor.lastName as executorLastName',
          )
          .leftJoinRelated('[status, creator, executor]');
        reply.render('tasks/view', { task });
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
        const statuses = await app.objection.models.status.query().orderBy('name');
        const users = await app.objection.models.user.query().orderBy('first_name', 'last_name');
        reply.render('tasks/edit', { task, statuses, users });
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

        const {
          name, description, statusId, executorId,
        } = req.body.data;

        const jsonData = {
          name,
          description,
          statusId: parseInt(statusId, 10),
          creatorId: req.user.id,
        };

        if (executorId !== '') {
          jsonData.executorId = parseInt(executorId, 10);
        }

        try {
          const task = await app.objection.models.task.query().findById(id);
          await task.$query().update(jsonData);
          req.flash('info', i18next.t('flash.tasks.update.success'));
          reply.status(302);
          reply.redirect(app.reverse('tasks'));
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.tasks.update.error'));
          reply.status(422);
          reply.render('tasks/edit', {
            task: { ...jsonData, id }, errors: data,
          });
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
          reply.status(302);
          reply.redirect(app.reverse('task'));
        }
        return reply;
      },
    );
};
