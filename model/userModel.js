const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, 'Please tell us your name']
    },
    email:{
        type: String,
        required:[true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo:{
        type:String
    },
    role: {
        type:String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required:[true, 'Please provide a password'],
        minlength: 8,
        select: false 
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate : {
            // This only works on CREATE and SAVE!!
            validator: function(el) {
                return el === this.password
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type:Boolean,
        default:true,
        select:false
    }
})

userSchema.pre('save',async function(next) {
    // Only run this function, if password was modified
    if(!this.isModified('password')){
        return next()
    }

    this.password = await bcrypt.hash(this.password,12)
    //Deleting passwordConfirm field
    this.passwordConfirm = undefined // as we need this field just for input and not to be persisted in the database.
    next()
})

userSchema.pre('save', function(next){
    if (!this.isModified('password') || this.isNew) {
        return next()
    }

    this.passwordChangedAt = Date.now() - 1000
    next()
})

userSchema.pre(/^find/, function(next) {
    this.find({active:{ $ne:false }});
    next(); 
});


userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    // for instance method, this points to current document
    if(this.passwordChangedAt) { 
        // changing the date format to milliseconds similar to JWTTimestamp's iat
        const changedTimestamp  = parseInt(this.passwordChangedAt.getTime() / 1000, 10) // base 10 number

        return JWTTimestamp < changedTimestamp
    }

    // False means password not changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    console.log(resetToken)
    console.log(this.passwordResetToken)

    return resetToken
}

const User = mongoose.model('User',userSchema);
module.exports = User;