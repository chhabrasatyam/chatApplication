const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const colors = require("colors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { request } = require("express");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept json data

app.get("/", (req, res) => {
  res.send("API Running!");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// -----------------------------------------------------------------------------
// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT; //4000

const server = app.listen(
  4000,
  console.log(`server connected on port ${PORT}`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    // console.log(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("user Joined Room: " + room);
    // socket.emit("connected");
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (NewMessageRecieved) => {
    var chat = NewMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");
    

    chat.users.forEach((user) => {
      if (user._id == NewMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", NewMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

// app.get("/api/chat", (req, res) => {
//   res.send(chats);
// });

// app.get("/api/chat/:id", (req, res) => {
//   //   res.send(req.params.id);
//   const singlechat = chats.find((c) => c.id === req.params.id);
//   res.send(singlechat);
// });
