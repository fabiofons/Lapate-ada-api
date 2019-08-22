const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const matchSchema = mongoose.Schema({
  user: {
    type: String,
    require: [true, 'is required'],
  },
  gameName: {
    type: String,
    trim:true,
    require: [true, 'is required'],
  },
  date: {
    type: Date, 
    required: [true, 'is required']
  },
  modality: String,
  public: Boolean,
  place: String,
  location: {
    type: pointSchema,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'is required']
  },
  players: {
    type:[String],
    default: undefined
  }
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
