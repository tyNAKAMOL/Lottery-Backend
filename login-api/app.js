var express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const session = require("express-session");
var cors = require("cors");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const secret = "Login";

var app = express();
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "mydb",
});

app.use(
  session({
    secret: "Login-Logout",
    resave: false,
    saveUninitialized: false,
  })
);

router.post("/register", jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.Password, saltRounds, function (err, hash) {
    connection.execute(
      "INSERT INTO account (Username,Email,Password,FirstName,LastName) VALUES (?,?,?,?,?)",
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
});
router.post("/login", jsonParser, function (req, res, next) {
  console.log(req.body);
  connection.execute(
    "SELECT * FROM account WHERE Username=?",
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
        }
      );
    }
  );
});

router.post("/logout", jsonParser, function (req, res) {
  console.log(req.body.token);
  const decoded = jwt.verify(req.body.token, secret);
  const { username } = decoded;
  connection.execute(
    "SELECT * FROM account WHERE Username=?",
    [username],
    function (err, users, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      if (users.length == 0) {
        res.json({ status: "error", message: "no user found" });
        return;
      }
      res.json({ status: "ok", message: "logout success" });
    }
  );
});

router.post("/authen", jsonParser, function (req, res, next) {
  try {
    const arr = req.headers.authorization.split(" ");
    const token = arr[1];
    var decoded = jwt.verify(token, secret);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

app.use(router).listen(3333, function () {
  console.log("Server Started...");
});
