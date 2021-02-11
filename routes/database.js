const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;

//Database Link
const uri = "mongodb+srv://mst_saiteja:mst_project@cluster0.3lesx.mongodb.net/bank?retryWrites=true&w=majority";

//Database client
const client = MongoClient(uri,{useNewUrlParser:true, useUnifiedTopology: true});

//database and collection name
const db = "bank";
const collection = "customers";

//User Schema
const transaction = new mongoose.Schema({
    time : String,
    details : String,
    amount : Number
});

const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String,
    mobile : String,
    address : {type : String,maxlength : 100},
    amount : {type : Number,default : 1000,min : 0},
    transactions : [transaction]
},{collection : 'customers'}
); 

const User = mongoose.model('bank',userSchema);

//database connection
function connect(){
    client.connect( (err) => {
        if(err) console.log("Unable to connect to database...!");
        else console.log("Connected to database...!");
    }); 
}

module.exports = { client, db, collection, User, uri, connect };