'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');


/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async find(ctx) {
    let entities;
    const permissionId = ctx.state.user.custom_permission
    const permissions = await strapi.services['custom-permissions'].findOne({ id: permissionId });

    if (permissions.clients_view === 'onlyAssigned'){
      ctx.query.assignedTo_in = [ctx.state.user.id];
    } else if (permissions.clients_view === 'None') {
      ctx.response.forbidden({message: 'You dont have access to this records'});
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
    const { id } = ctx.params;
    const permissionId = ctx.state.user.custom_permission
    const permissions = await strapi.services['custom-permissions'].findOne({ id: permissionId });
    const entity = await strapi.services.clients.findOne({ id });

    if (permissions.clients_view === 'onlyAssigned') {
      if(!entity.assignedTo.some(el => el.id === ctx.state.user.id)){
        ctx.response.forbidden({message: 'You dont have access to this records'});
        return ctx.response;
      }
    } else if (permissions.clients_view === 'None') {
      ctx.response.forbidden({message: 'You dont have access to this records'});
      return ctx.response;
    }

    return sanitizeEntity(entity, { model: strapi.models.clients });
  },


    async create(ctx) {
        let entity;
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

    // async update(ctx){
    //   let entities;
    //   if (ctx.query._q) {
    //     entities = await strapi.services.users.search(ctx.query);
    //   } else {
    //     entities = await strapi.services.users.find(ctx.query);
    //   }

    //   return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.restaurant }));
    // },
};
