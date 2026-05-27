require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// CORS - GitHub Pages allow karo
app.use(cors({
  origin: 'https://zunii66.github.io',  // Tumhara frontend domain
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,       // Agar HTTPS ho toh 'true' kar dena
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 1 din
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  profileFields: ['id', 'displayName', 'photos', 'email']
},
(accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;   // Token store karo
  return done(null, profile);
}));

// Home route
app.get('/', (req, res) => res.send('✅ Backend is running'));

// Login - extra permissions
app.get('/auth/facebook',
  passport.authenticate('facebook', {
    scope: ['email', 'user_friends', 'pages_read_engagement']
  })
);

// Callback - frontend pe redirect karo with token
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'https://zunii66.github.io/fbintegrate/' }),
  (req, res) => {
    if (!req.user) return res.redirect('https://zunii66.github.io/fbintegrate/');

    const name = encodeURIComponent(req.user.displayName || 'User');
    const id = req.user.id;
    const accessToken = req.user.accessToken;
    const photo = req.user.photos?.[0]?.value || `https://graph.facebook.com/${id}/picture?type=large`;

    // Sare params pass karo (access_token bhi)
    res.redirect(
      `https://zunii66.github.io/fbintegrate/dashboard.html?name=${name}&id=${id}&photo=${encodeURIComponent(photo)}&access_token=${accessToken}`
    );
  }
);

// ---------- APIs for Dashboard ----------
// 1️⃣ Friends count
app.get('/api/friends', async (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const response = await fetch(`https://graph.facebook.com/me/friends?fields=summary&access_token=${req.user.accessToken}`);
    const data = await response.json();
    res.json({ count: data.summary?.total_count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Page posts (News Feed) - apni page ID dalo
app.get('/api/page-posts', async (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const pageId = '61589300180597';  // Aapki page ID
  try {
    const response = await fetch(`https://graph.facebook.com/${pageId}/feed?fields=id,message,created_time,full_picture,reactions.summary(true),comments.summary(true),shares&limit=5&access_token=${req.user.accessToken}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Specific post stats
app.get('/api/post-stats', async (req, res) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const postId = req.query.post_id;
  if (!postId) return res.status(400).json({ error: 'post_id required' });
  try {
    const response = await fetch(`https://graph.facebook.com/${postId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${req.user.accessToken}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
