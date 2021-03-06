'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');


/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async find(ctx) {
    let entities;
    // const permissionId = ctx.state.user.custom_permission
    const permissions = ctx.state.user.userPermissions.permissions.reduce((acc, curr) => {
      if(curr.module === 'clients'){
        acc = curr;
        return acc;
      }
    }, {})


    if (permissions.clients_view === 'onlyAssigned'){
      ctx.query.assignedTo_in = [ctx.state.user.id];
    } else if (permissions.clients_view === 'None') {
      ctx.response.forbidden({message: `You don't have access to this records`});
      return ctx.response;
    }

    if (ctx.query._q) {
      entities = await strapi.services.clients.search(ctx.query);
      if (permissions.clients_view === 'onlyAssigned'){
        entities = entities.filter(res => {
            if(res.assignedTo.some(el => el.id === ctx.state.user.id)){
              return res
            }
        })
      }
    } else {
      entities = await strapi.services.clients.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.clients }));
  },

  async findOne(ctx) {
    let entity;
    const { id } = ctx.params;
    const permissionId = ctx.state.user.custom_permission
    const permissions = await strapi.services['custom-permissions'].findOne({ id: permissionId });
    try {
      entity = await strapi.services.clients.findOne({ id });
    } catch (error) {
      return ctx.badRequest(null, [error.message])
    }

    if (permissions.clients_view === 'onlyAssigned') {
      if(!entity.assignedTo.some(el => el.id === ctx.state.user.id)){
        ctx.response.forbidden({message: `You don't have access to this records`});
        return ctx.response;
      }
    } else if (permissions.clients_view === 'None') {
      ctx.response.forbidden({message: `You don't have access to this records`});
      return ctx.response;
    }

    return sanitizeEntity(entity, { model: strapi.models.clients });
  },

  async create(ctx) {
    let entity;
    if (typeof ctx.request.body.assignedTo === 'string'){
      ctx.request.body.assignedTo = [];
    }
    ctx.request.body.recordName = `${ctx.request.body.firstName} ${ctx.request.body.lastName}`

    console.log(ctx.request.body)
    const currentUser = ctx.state.user;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      ctx.data.createdBy = currentUser.id;
      entity = await strapi.services.clients.create(data, { files });
    } else {
      ctx.request.body.createdBy = currentUser.id;
      entity = await strapi.services.clients.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.clients });
  },

  async update(ctx){
    const { id } = ctx.params;
    ctx.request.body.recordName = `${ctx.request.body.firstName} ${ctx.request.body.lastName}`
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.clients.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.clients.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.clients });
  },
};
