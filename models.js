var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var quoteSchema = new Schema({
  quote: String,
  author: String
});

module.exports = mongoose.model('Quote', quoteSchema);
