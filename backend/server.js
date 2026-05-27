require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const cors = require('cors');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  profileFields: ['id', 'displayName', 'photos']
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.get('/', (req, res) => {
  res.send('Backend Running');
});

app.get('/auth/facebook',
  passport.authenticate('facebook', {
    scope: ['email']
  })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: 'https://zunii66.github.io/fbintegrate/'
  }),
  (req, res) => {

    if (!req.user) {
      return res.redirect('https://zunii66.github.io/fbintegrate/');
    }

    const name = encodeURIComponent(req.user.displayName || "User");
    const id = req.user.id;

    const photo =
      req.user.photos?.[0]?.value ||
      `https://graph.facebook.com/${id}/picture?type=large`;

    return res.redirect(
      `https://zunii66.github.io/fbintegrate/dashboard.html?name=${name}&id=${id}&photo=${encodeURIComponent(photo)}`
    );
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server Started');
});
