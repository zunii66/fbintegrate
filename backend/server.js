app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/'
  }),
  (req, res) => {

    const name = encodeURIComponent(req.user.displayName);
    const id = req.user.id;

    const photo =
      `https://graph.facebook.com/${id}/picture?type=large`;

    res.redirect(
      `https://zunii66.github.io/fbintegrate/dashboard.html?name=${name}&id=${id}&photo=${photo}`
    );
  }
);
