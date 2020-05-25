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

    if(recordId === userId && role !== 'administrator') {
      try {
        delete ctx.request.body.role
        delete ctx.request.body.blocked
        delete ctx.request.body.userPermissions
        entity = await strapi.plugins['users-permissions'].services.user.edit({id: recordId}, ctx.request.body);
      } catch (err) {
        console.log(err)
        ctx.body = err;
      }
    } else if (role === 'administrator'){
      try {
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

  /*
  * Get the data for any Data table in the system
  * This method receive 2 paramenters ContentType and Model, contentType is to filter the fields collection and only get
  * the fields to the specific type, model is to pull the data from the DB, in must cases model and contentType are equal
  */

  async tableData(ctx) {
    let entities;
    let count;
    const contentType = ctx.params.contentType;
    const model = ctx.params.model;

    /*
    * Get the user permissions from the user record and filter the response base on permissions
    */

    const permissions = await ctx.state.user.userPermissions.permissions.reduce((acc, curr) => {
      if(curr.contentType === ctx.params.contentType){ acc = curr; }
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

    /*
    * Get the records and count from the DB
    */

    if(contentType === 'users'){
      delete ctx.query.assignedTo_in;
      count = await strapi.query('user', 'users-permissions').count()
      entities = await strapi.plugins['users-permissions'].services.user.fetchAll(ctx.query);
    } else {
      count = await strapi.query(model).count(ctx.query);
      entities = await strapi.query(model).find(ctx.query)
    }

    /*
    * Loop through all the fields and overide column visibility and position with the users preference,
    * if users doenst have preference for this type, return the default fileds
    */

    const fields = await strapi.services['settings-fields'].find({contentType});
    const userColumns = await strapi.services['settings-columns'].find({contentType, user_in: [ctx.state.user.id]});

    let columns = await Promise.all(fields.map(async (field) => {
      for await (const userPref of userColumns) {
        if(userPref.fieldName === field.fieldName){
          field.tablePosition = userPref.tablePosition;
          field.tableVisible = userPref.tableVisible;
        }
      }
      return field
    }));

    let dataColumns = await Promise.all(columns
      .sort((a, b) => (a.tablePosition > b.tablePosition) ? 1 : ((b.tablePosition > a.tablePosition) ? -1 : 0))
      .filter(col => col.tableVisible === true)
      .map(col => col.fieldName)
    );
    dataColumns = dataColumns.concat(['id', 'recordName']);

    /*
    * iterate through the response and remove the unnecessary columns
    */

    entities = await Promise.all(entities.map(entity => {
      Object.keys(entity).forEach(key => {
        if(!dataColumns.includes(key)){
          delete entity[key]
        } else {
          if(Array.isArray(entity[key])){
            entity[key] = entity[key].map(ent => {
              const {id, recordName, label} = ent
              return {id, recordName, label}
            });
          }
        }
      })
      return entity;
    }));

    return {count, entities, columns, dataColumns};
  },
};
