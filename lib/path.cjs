if (typeof require !== 'undefined') {
  var path = require('path')
  if (path.default) path = path.default
  exports.default = path
  module.exports = exports.default
}
