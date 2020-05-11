'use strict';

/**
 * A set of functions called "actions" for `endpoint`
 */

module.exports = {

  /**
   * Users CRUD operations
   */

  findOneUser: async (ctx, next) => {
    let entity;
    const { id } = ctx.params;
    const { role } = ctx.state.user;
    const { defaultPermissions } = await strapi.services['global-preferences'].find();
    let currUserPermissions = await ctx.state.user.userPermissions.permissions;
    for await (const currUserPerm of currUserPermissions) {
      if(currUserPerm.mudule === 'users'){
        currUserPermissions = currUserPerm;
      }
    }
    // reduce((acc, curr) => {
    //   if(curr.module === 'users'){
    //     acc = curr;
    //     return acc;
    //   }
    // }, {})

    try {
      if(role.type === 'administrator' || currUserPermissions.view !== 'None') {
        entity = await strapi.plugins['users-permissions'].services.user.fetch({id});
        const { userPermissions } = entity
        const permissions = await Promise.all(defaultPermissions.permissions.map(async perm => {
          if(userPermissions && userPermissions.permissions) {
            for await (const userPerm of userPermissions.permissions) {
              if(perm.module === userPerm.module){
                perm = userPerm;
              }
            }
          } else {
            delete perm.id;
            delete perm._id
          }
          return perm
        }))
        if(role.type === 'administrator'){
          entity.userPermissions = {permissions}
        } else {
          entity.userPermissions = {}
        }
      }
    }
    catch (err) {
      console.log(err)
      ctx.body = err;
    }
    return entity;
  },

  updateUser: async (ctx, next) => {
    let entity;
    const recordId = ctx.params.id;
    const userId = ctx.state.user.id;
    const role = ctx.state.user.role.type;

    if(recordId === userId || role === 'administrator'){
      try {
        console.log(ctx.request.body);
        if(role !== 'administrator'){
          delete ctx.request.body.role
          delete ctx.request.body.blocked
          delete ctx.request.body.userPermissions
        }
        console.log(ctx.request.body);
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

  /**
   * Users Permissions
   */

  async findUsersPermissions(ctx){
    let entities;
    const { defaultPermissions } = await strapi.services['global-preferences'].find();

    entities = await strapi.plugins['users-permissions'].services.user.fetchAll();

    // Check if all users have permissiona and if not set the default permissions
    entities = await Promise.all(entities.map(async user => {
      console.log(user);
      let {id, recordName, userPermissions} = user
      userPermissions = await Promise.all(defaultPermissions.permissions.map(async perm => {
        if(userPermissions && userPermissions.permissions) {
          for await (const userPerm of userPermissions.permissions) {
            if(perm.module === userPerm.module){
              perm = userPerm;
            }
          }
        } else {
          delete perm.id;
          delete perm._id
        }
        return perm
      }))

      return {id, recordName, userPermissions};
    }))

    return entities
  },

  async setUsersPermissions(ctx){
    let entity;
    const userPermissions = ctx.request.body


    for await (const uPerm of userPermissions) {

      console.log(uPerm)
      entity = await strapi.plugins['users-permissions'].services.user.edit({id: uPerm.id}, {
          userPermissions: {
            permissions: uPerm.userPermissions
          }
      });
    }
    return ctx.request.body;
  },

  async tableData(ctx) {
    let entities;
    let count;
    const module = ctx.params.module;
    const columns = ctx.request.body.columns

    // Get the user permissions from the user record
    const permissions = await ctx.state.user.userPermissions.permissions.reduce((acc, curr) => {
      if(curr.module === ctx.params.module){ acc = curr; }
      return acc;
    }, {})

    if (permissions.view === 'onlyAssigned'){
      ctx.query = {
        ...ctx.query,
        assignedTo_in: [ctx.state.user.id]
      };
    } else if (permissions.view === 'None') {
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

    // iterate through the response and remove the unnecessary columns
    entities = await Promise.all(entities.map(entity => {
      Object.keys(entity).forEach(key => {
        if(!columns.includes(key)){
          delete entity[key]
        } else {
          if(Array.isArray(entity[key])){
            entity[key] = entity[key].map(ent => {
              const {id, recordName} = ent
              return {id, recordName}
            });
          }
        }
      })
      return entity;
    }));

    return {count, entities};
  },
};
