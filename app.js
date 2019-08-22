const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const User = require('./models/User');
const Match = require('./models/Match');
const cors = require('cors');
const app = express();

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Pateada" , { useNewUrlParser: true });

app.use(cors());
app.use(express.json());

const requireUser = async (req, res, next) => {
  const token = req.get("Authorization");
  if(token) {
    try {
      const decoded = await jwt.verify(token, process.env.SECRET_KEY || 'Guantanamo');
      if(decoded.userId) {
        const user = await User.findOne({ _id: decoded.userId });
        if(user) {
          res.locals.user = user;
          return next();
        }
      } else {
        res.status(401).json({ error: 'Invalid authorization token' });
      }
    } catch(err) {
      res.status(401).json({ error: 'Invalid authorization token' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized' });
  }
}

app.post('/register', async (req, res, next) => {
  try {
    const exist = await User.findOne({ email: req.body.email });
    if(exist) {
      res.json({error: "El usuario ya se encuentra registrado"})
    } else {
      const user = await User.create({
        nickname: req.body.nickname,
        email: req.body.email,
        password: req.body.password
      });
      const token = jwt.sign({ userId: user._id }, process.env.SECRET || 'Guantanamo');
      res.json(token);
    }
  } catch(err) {
    if(err.name === "ValidationError"){
      res.json({ error: err.errors });
    } else {
      next(err);
    }  
  }
});


app.post('/login', async (req, res, next) => {
  try { 
    const user = await User.authenticate(req.body.email, req.body.password);
    if(user) {
      const token = jwt.sign({ userId: user._id }, process.env.SECRET || 'Guantanamo');
      res.json({ token });
    } else {
      res.status(401).json({ error: "User or password is invalid" });
    }
  } catch(err) {
    next(err);
  }  
});

//para el perfil del usuario...
app.get('/user', requireUser, (req, res, next) => {
  const info = {
    nickname: res.locals.user.nickname,
    email: res.locals.user.email,
    id: res.locals.user._id,
    matches: res.locals.user.matches,
    repute: res.locals.user.repute,
    level: res.locals.user.level
  };
  res.json(info);
})

app.get('/matches', async (req, res, next) => {
  try {
    const markers = await Match.find({date: {$gt:Date.now()}});
    res.json(markers);
  } catch (err) {
    next(err);
  }
});

app.post('/matches', requireUser, async (req, res, next) => {
  const long = req.body.longitude;
  const lat = req.body.latitude;
  const match = {
    user: res.locals.user._id,
    gameName: req.body.gameName,
    date: new Date(req.body.date),
    modality: req.body.modality,
    public: req.body.public,
    place: req.body.place,
    price: req.body.price,
    location: {
      "type" : "Point",
      "coordinates" : [lat, long]
    },
    players: [res.locals.user._id]
  }
  try {
    const response = await Match.create(match);
    await User.updateOne({_id: res.locals.user._id}, {$set:{"matches":[response._id]}})
    res.json(response);
  } catch(err) {
    next(err);
  }
});

app.post('/matches/:id/join', requireUser, async (req, res, next) => {
  try {  
    //Update matches in the user
    await User.updateOne({_id: res.locals.user._id}, {$set:{"matches":res.locals.user.matches.concat(req.params.id)}})

    //Update participants of the match
    const match = await Match.find({_id: req.params.id});
    const newPlayer = await match[0].players.concat(res.locals.user._id);
    const isUpdate = await Match.updateOne({_id: req.params.id}, {$set:{"players":newPlayer}});
    if(isUpdate.ok) {
      const response = await await Match.find();
      res.json(response);
    } else {
      res.json({ error: "No se puede unir a esta pateada en el momento" })
    }
  } catch(err) {
    next(err);
  }
});

app.post('/matches/:id/delete', requireUser, async (req, res, next) => {
  try {  
    //Delete match in the user
    await User.updateOne({_id: res.locals.user._id}, {$set:{"matches":res.locals.user.matches.filter(m => m !== req.params.id)}})

    //Dalete participant of the match
    const match = await Match.find({_id: req.params.id});
    const removePlayer = await match[0].players.filter(m => m !== `${res.locals.user._id}`);
    const isUpdate = await Match.updateOne({_id: req.params.id}, {$set:{"players":removePlayer}});
    if(isUpdate.ok) {
      const response = await await Match.find();
      res.json(response);
    } else {
      res.json({ error: "No se puede Eliminar a esta pateada en el momento" })
    }
  } catch(err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Listening on port ${3001}!..`));