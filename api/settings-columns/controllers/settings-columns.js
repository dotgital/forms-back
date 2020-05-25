'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  /*
  * This method gets all the fields (settings-fields) and the users columns settings (settings-columns) for an specific content type
  * loops through the fields and overide the field setting with the user column settings values
  */

  find: async (ctx) => {
    let entities;
    try {
      const query = {
        ...ctx.query,
        user_in: [ctx.state.user.id]
      }
      const fields = await strapi.services['settings-fields'].find({contentType: query.contentType});
      const columns = await strapi.services['settings-columns'].find(query)
      entities = await Promise.all(fields.map(async (field) => {
        delete field.id;
        delete field._id;
        for await (const column of columns) {
          if(column.fieldName === field.fieldName){
            field.id = column.id;
            field.tablePosition = column.tablePosition;
            field.tableVisible = column.tableVisible;
          }
        }
        return field
      }));
      // await Promise.all(columns.sort((a, b) => (a.tablePosition > b.tablePosition) ? 1 : ((b.tablePosition > a.tablePosition) ? -1 : 0)))

    } catch (err) {
      console.log(err)
      ctx.body = err;
    }
    return entities;
  },

  /*
  * Receive an array with the columns objects, loop through the array if column have id update the columns record
  * if not create a new record
  */

  create: async (ctx) => {
    const column = ctx.request.body;
    const userId = ctx.state.user.id
    column.map(col => {
      col.user = userId;
      if ( col.id ) {
        strapi.services['settings-columns'].update({id: col.id}, col)
      } else {
        strapi.services['settings-columns'].create(col);
      }
    });
    return ctx.request.body
  }
};
