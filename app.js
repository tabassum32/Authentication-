const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Sever Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbServer();

app.post("/register", async (response, request) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  let checkUserName = `select * from user where username= '${username}';`;
  const userData = await db.get(checkUserName);
  if (userData === undefined) {
    let postNewUser = `insert into user (username, name, password, gender, location) values ('${username}', '${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let userCreated = await db.run(postNewUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username = '${username}';`;
  const user = await db.get(selectUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatched = await bcrypt.compare(password, user.password);
    if (passwordMatched === true) {
      response.status(200);
      response.send("Login success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `select * from user where username = '${username}';`;
  const user = await db.get(userQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (validPassword === true) {
      if (password.length < 5) {
        const passwordNew = await bcrypt.hash(newPassword, 10);
        const updateNewPassword = `update user set password = '${newPassword}'where username = '${username}';`;
        const updated = await db.run(updateNewPassword);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
