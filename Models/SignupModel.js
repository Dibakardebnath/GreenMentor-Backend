
const mongoose= require('mongoose')

const SignUpShema=new mongoose.Schema({

    name:String,
    email:String,
    password:String,
   
},
{
    timestamps: true

})

const SignUpModel=mongoose.model('signup',SignUpShema)

module.exports = {SignUpModel}