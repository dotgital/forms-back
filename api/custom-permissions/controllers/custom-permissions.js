'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const sanitizeUser = user =>
sanitizeEntity(user, {
  model: strapi.query('user', 'users-permissions').model,
});

module.exports = {
  find: async (ctx) => {
    let users;
    users = await strapi.plugins['users-permissions'].services.user.fetchAll();
    let data = users.map(sanitizeUser);

    data = await Promise.all(data.map(async (user) => {
      if(!user.custom_permission){
        await strapi.services['custom-permissions'].create({user: user.id});
      }
      const userPermissions = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        custom_permission: user.custom_permission
      }
      return userPermissions;
    }));
    ctx.send(data);
  },

  setPermission: async (ctx) => {
    let entity;
    const userPermissions = ctx.request.body
    userPermissions.forEach((res) => {
      if(res.custom_permission.id){
        const id = res.custom_permission.id;
        entity = strapi.services['custom-permissions'].update({ id }, res.custom_permission);
      } else {
        res.custom_permission.user = res.id
        entity = strapi.services['custom-permissions'].create(res.custom_permission);
      }
    })
    return ctx.request.body;
  }
};
