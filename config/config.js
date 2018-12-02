const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/rest-api-ath',  { useNewUrlParser: true });

module.exports = {mongoose, 'secret': 'devdacticIsAwesome'}
