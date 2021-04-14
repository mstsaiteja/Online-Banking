const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
require('dotenv-safe').config();

//User Schema
const Transaction = new Schema({
    time : String,
    details : String,
    amount : Number
});

const UserSchema = new Schema({
    name : String,
    email : String,
    password : String,
    mobile : String,
    address : {type : String,maxlength : 100},
    amount : {type : Number,min : 0},
    transactions : [Transaction]
}); 

const UserModel = Mongoose.model('customers',UserSchema);

module.exports = UserModel;