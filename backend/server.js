require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const cors = require('cors');

const app = express();

app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    profileFields: ['id', 'displayName', 'photos']
  },
  function(accessToken, refreshToken, profile, done) {

    return done(null, profile);
  }
));

app.get('/', (req, res) => {
  res.send('Backend Running');
});

app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/'
  }),
  (req, res) => {

    const name = encodeURIComponent(req.user.displayName);
    const id = req.user.id;

    let photo = '';

    if (
      req.user.photos &&
      req.user.photos.length > 0
    ) {
      photo = encodeURIComponent(req.user.photos[0].value);
    }

    res.redirect(
      `https://zunii66.github.io/fbintegrate/dashboard.html?name=${name}&id=${id}&photo=${photo}`
    );
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Server Started');
});
