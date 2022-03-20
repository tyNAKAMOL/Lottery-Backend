const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const secret = "Login";
const mysql = require("mysql2");

const connectionUser = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "user",
});

const connectionCustomer = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "customer",
});

const login = (req, res) => {
  console.log(req.body);
  connectionUser.execute(
    "SELECT * FROM user WHERE Username=?",
    [req.body.Username],
    function (err, users) {
      console.log(users);
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
          console.log(err);
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
    console.log(req.body);
    // console.log(typeof req.body);
    // //console.log(Object.keys(req.body)==['Title','Firstname','Lastname','Username','Password','Email','Birthday','Tel','Address','IDCard','URLImage','Role']);
    let errMsg = "";
    // //let a = await validate();
    // if (!req.body.soi) {
    //   res.json({ status: "Error", message: "soi is null" });
    // } else {
    //   res.json({ status: "200OK", message: "Register Success" });
    // }

    connectionCustomer.execute(
      "SELECT * FROM customer_account WHERE Username=? or Email=?",
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
            connectionUser.execute(
              "INSERT INTO user (Username,Password,Role) VALUES (?,?,?)",
              [req.body.Username, hash, req.body.Role],
              function (err) {
                if (err) {
                  res.json({ status: "error", message: err });
                  return;
                }
              }
            );
          });
          connectionCustomer.execute(
            "INSERT INTO customer_account (Title,Firstname,Lastname,Username,Email,Birthday,Tel,HomeNo,Soi,Road,Subdistrict,District,Province,ZipCode,IDCard,URLImage) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
              req.body.Title,
              req.body.Firstname,
              req.body.Lastname,
              req.body.Username,
              req.body.Email,
              req.body.Birthday,
              req.body.Tel,
              req.body.Address.HomeNo,
              req.body.Address.Soi,
              req.body.Address.Road,
              req.body.Address.Subdistrict,
              req.body.Address.District,
              req.body.Address.Province,
              req.body.Address.ZipCode,
              req.body.IDCard,
              req.body.URLImage,
            ],
            function (err) {
              if (err) {
                connectionUser.execute(
                  "DELETE FROM user WHERE Username=?",
                  [req.body.Username],
                  function (error) {
                    if (error) {
                      res.json({ status: "error", message: error });
                      return;
                    }
                  }
                );
                res.json({ status: "error", message: err });
                return;
              }
              res.json({ status: "200OK", message: "Register Success" });
            }
          );
        }
      }
    );
  } catch (error) {
    res.json({ status: "error", message: error.message });
  }
};

const logout = (req, res) => {
  console.log(req.body.token);
  const decoded = jwt.verify(req.body.token, secret);
  const { username } = decoded;
  connectionUser.execute(
    "SELECT * FROM user WHERE Username=?",
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
