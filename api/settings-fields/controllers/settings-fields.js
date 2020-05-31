'use strict';
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

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
  },
  // api/clients/models/clients.settings.json

  create: async(ctx) => {
    let model;
    let entity
    let req = ctx.request.body
    const modelPath = path.join(__dirname, '..', '..', `${req.contentType}`, 'models', `${req.contentType}.settings.json`);

    try{
      // format the field name camelCase label underscore 3 digit ramdom to avoid fieldName Comflits
      req.fieldName = `${_.camelCase(req.label)}_${Math.floor(Math.random()*(999-100+1)+100)}`
      entity = await strapi.services['settings-fields'].create(req);

      // Read the model file and then attach the new attribute (field) and write the model field with new data
      await fs.promises.readFile(modelPath, 'utf8', function (err,data) {
        if (err) console.log(err);
        return data;
      }).then(async res => {
        model = JSON.parse(res)
        model.attributes[req.fieldName] = { "type": "string" }
        await fs.promises.writeFile(modelPath, JSON.stringify(model), (err) => {
          if (err) console.log(err);
          console.log("Successfully Written to File.");
        }).catch(err => console.log(err));
      }).catch(err => console.log(err));

    } catch (err) {
      console.log(err);
    }
    return entity
  },

  delete: async(ctx) => {
    let entity;
    const fieldId = ctx.params.id

    try {
      entity = await strapi.services['settings-fields'].delete({id: fieldId});
      const modelPath = path.join(__dirname, '..', '..', `${entity.contentType}`, 'models', `${entity.contentType}.settings.json`);
      console.log(entity);

      // Read the model file and then attach the new attribute (field) and write the model field with new data
      await fs.promises.readFile(modelPath, 'utf8', function (err,data) {
        if (err) console.log(err);
        return data;
      }).then(async res => {
        const model = JSON.parse(res)
        delete model.attributes[entity.fieldName]
        await fs.promises.writeFile(modelPath, JSON.stringify(model), (err) => {
          if (err) console.log(err);
          console.log("Successfully Written to File.");
        }).catch(err => console.log(err));
      }).catch(err => console.log(err));

    } catch (err) {
      console.log(err);
    }

    return entity;
  }
};
