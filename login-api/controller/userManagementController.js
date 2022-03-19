const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const secret = "Login";
const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "mydb",
});

const login = (req, res) => {
  console.log(req.body);
  connection.execute(
    "SELECT * FROM account WHERE Username=?",
    [req.body.Username],
    function (err, users) {
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
};

const register = (req, res, next) => {
  try {
    let errMsg = "";
    connection.execute(
      "SELECT * FROM account WHERE Username=? or Email=?",
      [req.body.Username, req.body.Email],
      function (err, results) {
        console.log(results.length);
        if (results.length > 0) {
          results.forEach((element) => {
            if (
              element.Username.toLowerCase() == req.body.Username.toLowerCase()
            ) {
              errMsg += "Username already exist";
            }
            if (element.Email.toLowerCase() == req.body.Email.toLowerCase()) {
              if (errMsg.length == 0) {
                errMsg = "Email already exist";
              } else {
                errMsg += " and Email already exist";
              }
            }
          });
          res.json({ status: "ok", message: errMsg });
        } else {
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
              function (err) {
                if (err) {
                  res.json({ status: "error", message: err });
                  return;
                }
                res.json({ status: "ok", message: "Register Success" });
              }
            );
          });
        }
      }
    );
  } catch (error) {
    res.json({ status: "error", message: err.message });
  }
};

const logout = (req, res) => {
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
};

module.exports = {
  login,
  register,
  logout,
};
