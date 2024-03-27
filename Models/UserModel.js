
const mongoose= require('mongoose')

const UserSchema=new mongoose.Schema({

    email:String,
    title:String,
    description:String,
    completed:Boolean,

},
{
    timestamps: true

})

const UserModel=mongoose.model('user',UserSchema)

module.exports = {UserModel}