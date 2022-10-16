import cookieParser from "cookie-parser";
import session from "express-session";
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const user_routers = require("./routes/user");
const chat_routes = require("./routes/chat");

const port = process.env.PORT || 3000;
const cookie_secret = process.env.COOKIE_SECRET || "secret";
const hour = 3600000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(cookieParser(cookie_secret));
const session_middleware = session({
  secret: cookie_secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: hour,
    secure: "auto",
  },
});
app.use(session_middleware);
app.use("/user", user_routers);
app.use("/chat", chat_routes);

app.get("/", (req, res) => {
  console.log("Cookies: ", req.cookies);
  console.log("Signed Cookies: ", req.signedCookies);
  const session = req.session;
  if (!session.user_name) {
    res.render("login");
  }
  const profile_info = {
    title: "Online Users",
    user_name: session.user_name,
  };
  res.render("profile", profile_info);
});
// temp session store
var names = new Object();
var ids = new Object();
var receivers = new Object();

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(session_middleware));
io.use((socket, next) => {
  const session = socket.request.session;
  const authenticated = session.authenticated;
  if (session && authenticated) {
    next();
  } else {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("socket session info", socket.request.session);
  const connection_id = socket.id;
  const session_id = socket.request.session.id;

  socket.join(session_id);

  socket.on("login", (name) => {
    names[connection_id] = name;
    ids[name] = connection_id;
    console.log("a new user connected");
    socket.broadcast.emit("users", { online: ids });
  });

  socket.on("receiver", (receiver) => {
    receivers[connection_id] = receiver;
  });

  socket.on("get_users", () => {
    io.to(connection_id).emit("online_users", { online: ids });
  });

  socket.on("disconnect", () => {
    delete ids[names[connection_id]];
    delete names[connection_id];
    socket.broadcast.emit("online_users", { online: ids });
    console.log(`${names[connection_id]} disconnected`);
  });

  socket.on("chat_message", (msg) => {
    io.emit("chat_message", msg);
  });

  io.to(ids[receivers[connection_id]]).emit(
    "chat_message",
    names[connection_id] + ":" + msg
  );
  io.to(connection_id).emit("chat_message", "me: " + msg);
});

app.post("/logout", (req, res) => {
  const session_id = req.session.id;
  req.session.destroy(() => {
    io.to(session_id).disconnectSockets();
    res.status(204).end();
  });
});

server.listen(port, () => {
  console.log(`Messaging app running at http://localhost:${port}/`);
});
