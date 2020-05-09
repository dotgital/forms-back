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
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
      return fields;
    })
    users = users.filter(user => {
      let propertyMatch;
      const filteredUser = Object.keys(user).some(k => {
        if(user[k] && user[k].toLowerCase().includes(ctx.query._q.toLowerCase())){
          propertyMatch = k;
          return k;
        }
      })
      user.matchProperty = propertyMatch;
      user.matchValue = user[propertyMatch]
      // console.log(filteredUser);
      return filteredUser
    });

    // clients
    // clients = await strapi.services.search.customSearch(ctx.query);
    // clients = await strapi.query('clients').find({ _q: ctx.query._q, _limit: 100 })
    clients = await strapi.services.clients.search(ctx.query)
    if (permissions.clients_view === 'onlyAssigned') {
      clients = clients.filter(res => {
        if (res.assignedTo.some(el => el.id === ctx.state.user.id)) {
          return res
        }
      })
    }
    clients = clients.map(client => {
      let propertyMatch;
      Object.keys(client).some(k => {
        if(typeof client[k] == 'string' && client[k].toLowerCase().includes(ctx.query._q.toLowerCase())){
          propertyMatch = k;
        }
      })
      const fields = {
        id: client.id,
        model: 'Client',
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        matchProperty: propertyMatch,
        matchValue: client[propertyMatch]
      }
      return fields;
    })


    return [].concat(users, clients);

    // return entities.map(entity => sanitizeEntity(entity, {
    //   model: strapi.models.clients
    // }));
  }
};
