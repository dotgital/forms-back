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

    response = await strapi.services['global-preferences'].find();
    if(moduleName){
      response = response[moduleName]
    }

    if(settingType == 'columns' && userPreferences && userPreferences[listView]){
      const resp = {}
      response = response.map(res => {
        const userPref = userPreferences[listView].reduce((acc, pref) => {
          pref.fieldName === res.name && pref.module === moduleName ? acc = pref : false;
          return acc
        }, {})
        res.id = userPref.id
        res.module = moduleName
        res.tableVisible = userPref.tableVisible
        res.tablePosition = userPref.tablePosition
        res.userFieldId = userPref.id ? userPref.id : null;
        return res
      })
      resp.fields = response;
      resp.usersPrefId = userPreferences.id;
      response = resp;
    }
    return response;
  }

  // async update(ctx){
  //   let response;
  //   const settingType = ctx.query.type;
  //   const moduleName = ctx.query.module;
  //   console.log(ctx.request.body);
  //   response = await strapi.services['global-preferences'].update({[moduleName]: ctx.request.body})
  //   return ctx.request.body
  // },

};
