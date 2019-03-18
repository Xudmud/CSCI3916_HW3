var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Don't need bcrypt really

var MovieSchema = new Schema({
    title: {type: String, required: true},
    year: {type: Int, required: true},
    genre: {type: String, required: true},
    actor: {{type: String, type: String}, required: true}
})
