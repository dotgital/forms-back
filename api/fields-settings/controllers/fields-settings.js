'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async find(ctx) {
    let response;
    const settingType = ctx.query.type;
    const module = ctx.query.module;
    const globalPreferences = await strapi.services['fields-settings'].find()
    const userPreferences = ctx.state.user.userPreferences;
    const listView = `${module}ListView`

    response = globalPreferences.fields.filter(field => field.module === module);

    if(settingType == 'columns' ){
      if(userPreferences && userPreferences[listView]){
        response = response.map(res => {
          const userPref = userPreferences[listView].reduce((acc, pref) => {
            pref.fieldName === res.name && pref.module === module ? acc = pref : false;
            return acc
          }, {})
          res.id = userPref.id
          res.module = module
          res.tableVisible = userPref.tableVisible
          res.tablePosition = userPref.tablePosition
          res.userFieldId = userPref.id ? userPref.id : null;
          // console.log('user pref', userPref)
          // console.log('global pref', res);
          return res
        })
        // console.log(userPreferences[listView]);
      }
    }

    // console.log(response);
    return response;
  },

  async userPreferences(ctx) {
    console.log(ctx)
  }
};
