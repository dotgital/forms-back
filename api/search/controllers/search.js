'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
/**
 * A set of functions called "actions" for `search`
 */

module.exports = {
  search: async (ctx, next) => {

    let clients;
    let users
    const permissionId = ctx.state.user.custom_permission
    const permissions = await strapi.services['custom-permissions'].findOne({
      id: permissionId
    });

    // users
    users = await strapi.plugins['users-permissions'].services.user.fetchAll();
    users = users.map(user => {
      const fields = {
        id: user.id,
        model: 'User',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
      return fields;
    })
    console.log(users);
    users = users.filter(user => {
        return Object.keys(user).some(k => user[k].toLowerCase().includes(ctx.query._q.toLowerCase()))
    });

    // clients
    clients = await strapi.services.clients.search(ctx.query);

    if (permissions.clients_view === 'onlyAssigned') {
      clients = clients.filter(res => {
        if (res.assignedTo.some(el => el.id === ctx.state.user.id)) {
          return res
        }
      })
    }
    clients = clients.map(client => {
      const fields = {
        id: client.id,
        model: 'Client',
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email
      }
      return fields;
    })


    return [].concat(users, clients);

    // return entities.map(entity => sanitizeEntity(entity, {
    //   model: strapi.models.clients
    // }));
  }
};
