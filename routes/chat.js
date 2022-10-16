const router = require("express").Router();

router.get("/:user_name", (req, res, next) => {
  const session = req.session;
  const receiver = req.params.user_name;
  const chat_id = req.params.chat_id;
  const chat_info = {
    id: chat_id,
    title: `Chat with ${receiver}`,
    user_name: session.user_name,
    receiver: receiver,
  };
  res.render("chat", chat_info);
});
module.exports = router;
