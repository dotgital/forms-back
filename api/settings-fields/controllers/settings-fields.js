'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  multiple: async(ctx) => {
    let entities;
    const fields = ctx.request.body

    entities = await Promise.all(fields.map(async (field) => {
      await strapi.services['settings-fields'].update({id: field.id}, field);
    }));

    // for await (const field of fields) {
    //   console.log(field)
    //   await strapi.services['settings-fields'].update({id: field.id}, field);
    // }

    // console.log(entities);
    return entities;
  }
};
