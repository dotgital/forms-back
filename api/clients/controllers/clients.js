'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');


/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
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

    async update(ctx){
      let entities;
      if (ctx.query._q) {
        entities = await strapi.services.users.search(ctx.query);
      } else {
        entities = await strapi.services.users.find(ctx.query);
      }

      return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.restaurant }));
    },
};
