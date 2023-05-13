/* eslint-env mocha */

// items tests
const entityExtractor = require('../lib/entity_dmg_extractor.js')

describe('entity_dmg_extractor', function () {
  const date = '2019-05-07T00:00:00Z'
  it('get entities dmg', function (cb) {
    entityExtractor.getEntityDmg(date, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      console.log(data)
      cb()
    })
  })

})
