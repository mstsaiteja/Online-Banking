const Mongoose = require('mongoose')

const uri = process.env.DB_URI

Mongoose.connect(uri,{useNewUrlParser: true,useUnifiedTopology: true},(err)=>{
    if(err) console.log(err) 
    else console.log('Connected to Database...!')
})

