var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const secret = "Login";

var app = express();

app.use(cors());

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "mydb",
});

app.post("/register", jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.Password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
    connection.execute(
      "INSERT INTO users (Username,Email,Password,FirstName,LastName) VALUES (?,?,?,?,?)",
      [
        req.body.Username,
        req.body.Email,
        hash,
        req.body.FirstName,
        req.body.LastName,
      ],
      function (err, results, fields) {
        if (err) {
          res.json({ status: "error", message: err });
          return;
        }
        res.json({ status: "ok" });
      }
    );
  });
  //   var email = req.body.Email;
});
app.post("/login", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM users WHERE Username=?",
    [req.body.Username],
    function (err, users, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      if (users.length == 0) {
        res.json({ status: "error", message: "no user found" });
        return;
      }
      bcrypt.compare(
        req.body.Password,
        users[0].Password,
        function (err, isLogin) {
          if (isLogin) {
            var token = jwt.sign({ username: users[0].Username }, secret, {
              expiresIn: "1h",
            });
            res.json({ status: "ok", message: "login success", token });
          } else {
            res.json({ status: "error", message: "login failed" });
          }
          // result == false
        }
      );
      //   res.json({ status: "ok" });
    }
  );
});
app.post("/authen", jsonParser, function (req, res, next) {
  try {
    const arr = req.headers.authorization.split(" ");
    const token = arr[1];
    var decoded = jwt.verify(token, secret);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

app.listen(3333, function () {
  console.log("CORS-enabled web server listening on port 3333");
});
