const router = require("express").Router();
import io from "../index";

router.post("/login", (req, res, next) => {
  const session = req.session;
  session.user_name = req.body.user_name;
  session.authenticated = true;
  session.save();
  const profile_info = {
    title: "Online Users",
    user_name: session.user_name,
  };
  res.render("profile", profile_info);
});

module.exports = router;
