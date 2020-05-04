'use strict';

/**
 * A set of functions called "actions" for `endpoint`
 */

module.exports = {
  userUpdate: async (ctx, next) => {
    let entity;
    const recordId = ctx.params.id;
    const userId = ctx.state.user.id;
    const role = ctx.state.user.role.type;

    if(recordId === userId || role === 'administrator'){
      try {
        console.log(recordId);
        entity = await strapi.plugins['users-permissions'].services.user.edit({id: recordId}, ctx.request.body);
      } catch (err) {
        console.log(err)
        ctx.body = err;
      }
    } else {
      ctx.response.forbidden({message: `You don't have permissions to edit this user`});
      return ctx.response;
    }

    return entity;
  },

  async list(ctx) {
    let entities;
    let count;
    const module = ctx.params.module;
    const columns = ctx.request.body.columns
    const permissionId = ctx.state.user.custom_permission
    const permissions = await strapi.services['custom-permissions'].findOne({ id: permissionId });

    if (permissions.clients_view === 'onlyAssigned'){
      ctx.query = {
        ...ctx.query,
        assignedTo_in: [ctx.state.user.id]
      };
    } else if (permissions.clients_view === 'None') {
      ctx.response.forbidden({message: `You don't have access to this records`});
      return ctx.response;
    }

    if(module === 'users'){
      delete ctx.query.assignedTo_in;
      count = await strapi.query('user', 'users-permissions').count()
      entities = await strapi.plugins['users-permissions'].services.user.fetchAll(ctx.query);
    } else {
      count = await strapi.services[module].count(ctx.query);
      entities = await strapi.services[module].find(ctx.query)
    }

    entities = entities.map(entity => {
      Object.keys(entity).forEach(key => {
        if(!columns.includes(key)){
          delete entity[key]
        }
      })
      return entity;
    });

    entities = await Promise.all(entities);

    return {count, entities};
  },
};
