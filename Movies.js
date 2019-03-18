var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Don't need bcrypt really

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

//Movie schema
var MovieSchema = new Schema({
    title: {type: String, required: true},
    year: {type: Int, required: true},
    genre: {type: String, required: true},
    actor: {type: String, type: String, required: true}
});

MovieSchema.pre('save', function(next))
