'use strict';

/**
 * `search` service.
 */

module.exports = {
  // exampleService: (arg1, arg2) => {
  //   return isUserOnline(arg1, arg2);
  // }
  async customSearch(params) {
    let clients
    clients = await strapi.query('clients').model.find({firstName: {$regex: '.*' + params._q + '.*', $options: 'i'} });

    console.log(clients)
    return clients;
  },
};
