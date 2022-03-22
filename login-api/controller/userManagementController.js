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
                        }
                      }
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

const sellerUpdateAccount = (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username } = decoded;
    // var Role_ = "";
    console.log(req.params.action);
    connectionUser.execute(
      "SELECT * FROM user WHERE Username=?",
      [username],
      function (err, users) {
        if (err) {
          res.json({ status: "500IS", message: "Internal Server : " + err });
          return;
        }
        if (users.length == 0) {
          res.json({ status: "200NF", message: "No User Found" });
          return;
        } else {
          // console.log(users[0].Role);
          // Role_ += users[0].Role;
          if (req.params.action == "ChangeBankInfo") {
            connectionCustomer.execute(
              "UPDATE seller_account SET Bank_Account=?,Bank_Account_Number=? WHERE Username=? ",
              [req.body.Bank_Account, req.body.Bank_Account_Number, username],
              function (err) {
                if (err) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + err,
                  });
                  return;
                }
                res.json({
                  status: "200OK",
                  message: "Seller update bank success",
                });
              }
            );
          } else if (req.params.action == "ChangeImage") {
            connectionCustomer.execute(
              "UPDATE seller_account SET URL_image_profile=? WHERE Username=? ",
              [req.body.URL_image_profile, username],
              function (err) {
                if (err) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + err,
                  });
                  return;
                }
                res.json({
                  status: "200OK",
                  message: "Seller update URLImage success",
                });
              }
            );
          } else if (req.params.action == "ChangeAccountInfo") {
            connectionCustomer.execute(
              "UPDATE customer_account SET Title=?,Firstname=?,Lastname=?,Email=?,Birthday=?,Tel=?,HomeNo=?,Soi=?,Road=?,Subdistrict=?,District=?,Province=?,ZipCode=? WHERE Username=?",
              [
                req.body.Title,
                req.body.Firstname,
                req.body.Lastname,
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
                username,
              ],
              function (err) {
                if (err) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + err,
                  });
                  return;
                } else {
                  connectionCustomer.execute(
                    "UPDATE seller_account SET Storename=? WHERE Username=? ",
                    [req.body.Storename, username],
                    function (err) {
                      if (err) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + err,
                        });
                        return;
                      }
                      res.json({
                        status: "200OK",
                        message: "Seller update account success",
                      });
                    }
                  );
                }
              }
            );
          }
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const getSellerAccount = (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, secret);
    const { username } = decoded;
    connectionCustomer.execute(
      "select * from customer_account where username=?",
      [username],
      function (err, result) {
        if (err) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + err,
          });
          return;
        } else if (result.length == 0) {
          res.json({
            status: "200NF",
            message: "username not found in customer account",
          });
        } else {
          connectionCustomer.execute(
            "select * from seller_account where username=?",
            [username],
            function (err, result_) {
              if (err) {
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + err,
                });
                return;
              } else {
                let seller = {
                  Firstname: result[0].Firstname,
                  Lastname: result[0].Lastname,
                  Tel: result[0].Tel,
                  Birthday: result[0].Birthday,
                  Email: result[0].Email,
                  Address: {
                    HomeNo: result[0].HomeNo,
                    Soi: result[0].Soi,
                    Road: result[0].Road,
                    Subdistrict: result[0].Subdistrict,
                    District: result[0].District,
                    Province: result[0].Province,
                    ZipCode: result[0].ZipCode,
                  },
                  Storename: result_[0].Storename,
                  URLImage: result_[0].URL_image_profile
                };
                res.json({
                  status: "200OK",
                  message: "get data account Success",
                  sellenAccount: seller,
                });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
};

const getBankSeller = (req,res) => {
  try{
    const decoded = jwt.verify(req.params.token, secret);
    const { username } = decoded;
    connectionCustomer.execute(
      "select * from customer_account where username=?",
      [username],
      function (err, result) {
        if (err) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + err,
          });
          return;
        } else if (result.length == 0) {
          res.json({
            status: "200NF",
            message: "username not found in customer account",
          });
        } else {
          connectionCustomer.execute(
            "select * from seller_account where username=?",
            [username],
            function(err,result){
              if (err) {
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + err,
                }); 
            }
            else{
              let sellerBank = {
                Bank_Account : result[0].Bank_Account,
                Bank_Account_Number : result[0].Bank_Account_Number,
              };
              res.json({
                status: "200OK",
                message: "get Seller Bank Success",
                sellenBack: sellerBank ,
              });
            }
          }
            );
        }});
  }catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
}

module.exports = {
  login,
  register,
  logout,
  sellerUpdateAccount,
  getSellerAccount,
  getBankSeller,
};
