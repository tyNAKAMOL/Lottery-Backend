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
  try {
    connectionUser.execute(
      "SELECT * FROM user WHERE Username=?",
      [req.body.Username],
      function (err, users) {
        console.log(users);
        if (err) {
          res.json({ status: "500IS", message: "Internal Server : " + err });
          return;
        }
        if (users.length == 0) {
          res.json({ status: "200NF", message: "No User Found" });
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
              res.json({ status: "200OK", message: "Login success", token });
            } else {
              res.json({
                status: "200ER",
                message: "Wrong Username or Password",
              });
            }
          }
        );
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const register = (req, res, next) => {
  try {
    let Msg = "";
    for (const [key, value] of Object.entries(req.body)) {
      if (key == "Address") {
        for (const [key, value] of Object.entries(req.body.Address)) {
          if (value == "") {
            Msg += key + " ";
          }
        }
      }
      if (key == "URLImage") {
        continue;
      } else if (value == "") {
        Msg += key + " ";
      }
    }
    // //let a = await validate();
    if (Msg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + Msg,
      });
      return;
    } else {
      connectionCustomer.execute(
        "SELECT * FROM customer_account WHERE Username=? or Email=?",
        [req.body.Username, req.body.Email],
        function (err, results) {
          console.log(results.length);
          if (results.length > 0) {
            results.forEach((element) => {
              if (
                element.Username.toLowerCase() ==
                  req.body.Username.toLowerCase() &&
                element.Email.toLowerCase() == req.body.Email.toLowerCase()
              ) {
                res.json({
                  status: "200UE",
                  message: "Duplicate Username and Email",
                });
                return;
              } else if (
                element.Email.toLowerCase() == req.body.Email.toLowerCase()
              ) {
                res.json({ status: "200EM", message: "Duplicate Email" });
                return;
              } else if (
                element.Username.toLowerCase() ==
                req.body.Username.toLowerCase()
              ) {
                res.json({
                  status: "200UE",
                  message: "Duplicate Username",
                });
                return;
              }
            });
          } else {
            bcrypt.hash(req.body.Password, saltRounds, function (err, hash) {
              connectionUser.execute(
                "INSERT INTO user (Username,Password,Role) VALUES (?,?,?)",
                [req.body.Username, hash, req.body.Role],
                function (err) {
                  if (err) {
                    res.json({
                      status: "500IS",
                      message: "Internal Server : " + err,
                    });
                    return;
                  }
                  if (req.body.Role == "seller") {
                    connectionCustomer.execute(
                      "INSERT INTO seller_account (Username) VALUES (?)",
                      [req.body.Username],
                      function (err) {
                        if (err) {
                          res.json({
                            status: "500IS",
                            message: "Internal Server : " + error,
                          });
                          return;
                        }}
                    );
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
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                        return;
                      }
                    }
                  );
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + err,
                  });
                  return;
                }
                res.json({ status: "200OK", message: "Register Success" });
              }
            );
          }
        }
      );
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const logout = (req, res) => {
  console.log(req.body.token);
  const decoded = jwt.verify(req.body.token, secret);
  const { username } = decoded;
  try {
    connectionUser.execute(
      "SELECT * FROM user WHERE Username=?",
      [username],
      function (err, users, fields) {
        if (err) {
          res.json({ status: "500IS", message: "Internal Server : " + err });
          return;
        }
        if (users.length == 0) {
          res.json({ status: "200NF", message: "no user found" });
          return;
        }
        res.json({ status: "200OK", message: "Logout success" });
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

// const insertAccount = (req, res) => {
//   try {
//     const decoded = jwt.verify(req.body.token, secret);
//     const { username } = decoded;
//     let Role = "";
//     connectionUser.execute(
//       "SELECT * FROM user WHERE Username=?",
//       [username],
//       function (err, users) {
//         if (err) {
//           res.json({ status: "500IS", message: "Internal Server : " + err });
//           return;
//         }
//         Role = users[0].Role;
//       }
//     );
//     if (Role == "seller") {
//       connectionCustomer.execute(
//         "INSERT INTO customer_account (Storename,Bank_Account,Bank_Account_Number,URL_image_profile) VALUES (?,?,?,?)",
//         [
//           req.body.Storename,
//           req.body.Bank_Account,
//           req.body.Bank_Account_Number,
//           req.body.URL_image_profile,
//         ]
//       );
//     }
//   } catch (error) {
//     res.json({ status: "500IS", message: "Internal Server : " + error });
//   }
// };

module.exports = {
  login,
  register,
  logout,
};
