'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let response;
    const settingType = ctx.query.type;
    const moduleName = ctx.query.module;
    const userPreferences = ctx.state.user.userPreferences;
    const listView = `${moduleName}ListView`
    const resp = {}

    response = await strapi.services['global-preferences'].find();
    if(moduleName){
      response = response[moduleName]
    }

    if(settingType == 'columns'){
      if (userPreferences && userPreferences[listView]) {
        const fields = response.map(async (field)=> {
          let userField = {
            fieldName: field.fieldName,
            label: field.label,
            tablePosition: field.tablePosition,
            tableVisible: field.tableVisible,
            fieldType: field.fieldType,
          };
          for await (const userPref of userPreferences[listView]) {
            if (userPref.fieldName === field.fieldName){
              userField.id = userPref.id;
              userField.tableVisible = userPref.tableVisible;
              userField.tablePosition = userPref.tablePosition;
            }
          }
          return userField
        })
        resp.fields = await Promise.all(fields)
        resp.usersPrefId = userPreferences.id;
        response = resp;
      } else {
        resp.fields = response;
        response = resp;
      }
    }
    return response;
  }
};
