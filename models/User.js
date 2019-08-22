const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  nickname: String,
  email: {
    type: String,
    required: [true, 'is required'],
    lowercase: true,
    unique: true,
    trim: true
  },
  matches: {
    type:[String],
    default: []
  },
  password: {
    type: String,
    trim: true,
    required: [true,'Email address is required'],
    // validate: [validateEmail, 'Please fill a valid email address'],
    // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  repute: {
    type: Number,
    default: 5
  },
  level: {
    type: Number,
    default: 10
  }
});

userSchema.pre('save', function(next) {
  bcrypt.hash(this.password, 10, (err, hash) => {
    if(err) {
      return next(err);
    } else {
      this.password = hash;
      next();
    }
  });
});

userSchema.statics.authenticate = async (email, password) => {
  const user = await mongoose.model('User').findOne({ email: email });
  if(user) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if(err) reject(err);
        resolve(result === true ? user : null); 
      });
    });
  }
  return null;
}

const User = mongoose.model('User', userSchema);

module.exports = User;