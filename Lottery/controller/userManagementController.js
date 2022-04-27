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

const connectionAdmin = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "admin",
});

const validateMethod = (vd) => {
  let errMsg = "";
  for (const [key, value] of Object.entries(vd)) {
    if (value == null || value == "") {
      errMsg += key + " ";
    }
  }
  return errMsg;
};

const login = (req, res) => {
  console.log(req.body);
  try {
    let validateData = {
      Username: req.body.Username,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length == 0) {
      connectionUser.execute(
        "SELECT * FROM user WHERE Username=?",
        [req.body.Username],
        function (error, users) {
          console.log(users);
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          }
          if (users.length == 0) {
            res.json({ status: "200NF", message: "No User Found" });
            return;
          }
          bcrypt.compare(
            req.body.Password,
            users[0].Password,
            function (error, isLogin) {
              console.log(error);
              if (isLogin) {
                var token = jwt.sign(
                  { username: users[0].Username, role: users[0].Role },
                  secret,
                  {
                    expiresIn: "3h",
                  }
                );
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
    } else {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const register = (req, res, next) => {
  try {
    let Msg = "";
    let roleUser = "";
    console.log(req.body);
    let validateData = {
      Title: req.body.Title,
      Firstname: req.body.Firstname,
      Lastname: req.body.Lastname,
      Username: req.body.Username,
      Password: req.body.Password,
      Tel: req.body.Tel,
      Birthday: req.body.Birthday,
      Email: req.body.Email,
      Address: {
        HomeNo: req.body.Address.HomeNo,
        Soi: req.body.Address.Soi,
        Road: req.body.Address.Road,
        Subdistrict: req.body.Address.Subdistrict,
        District: req.body.Address.District,
        Province: req.body.Address.Province,
        ZipCode: req.body.Address.ZipCode,
      },
      IDCard: req.body.IDCard,
      wantToBeSeller: req.body.wantToBeSeller,
      URLImage: req.body.URLImage,
    };
    for (const [key, value] of Object.entries(validateData)) {
      console.log(value);
      if (key == "Address") {
        for (const [key, value] of Object.entries(validateData.Address)) {
          if (value == null || value == "" || value == []) {
            Msg += key + " ";
          }
        }
      }
      console.log(validateData.wantToBeSeller == "No");
      if (key == "URLImage" && validateData.wantToBeSeller == "No") {
        continue;
      } else if (key == "wantToBeSeller" && value != null) {
        continue;
      } else if (value == null || value == "" || value == []) {
        Msg += key + " ";
      }
    }
    if (Msg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + Msg,
      });
      return;
    } else {
      roleUser = req.body.Role + "_account";
      connectionCustomer.execute(
        "SELECT * FROM seller_account WHERE Username=? or Email=?",
        [req.body.Username, req.body.Email],
        function (error, results) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            console.log(results.length);
            if (results.length > 0) {
              CheckUsernameEmailError(results, req, res);
            } else {
              connectionCustomer.execute(
                "SELECT * FROM customer_account WHERE Username=? or Email=?",
                [req.body.Username, req.body.Email],
                function (error, results) {
                  if (error) {
                    res.json({
                      status: "500IS",
                      message: "Internal Server : " + error,
                    });
                    return;
                  } else {
                    console.log(results.length);
                    if (results.length > 0) {
                      CheckUsernameEmailError(results, req, res);
                    } else {
                      bcrypt.hash(
                        req.body.Password,
                        saltRounds,
                        function (error, hash) {
                          connectionUser.execute(
                            "INSERT INTO user (Username,Password,Role) VALUES (?,?,?)",
                            [req.body.Username, hash, req.body.Role],
                            function (error) {
                              if (error) {
                                res.json({
                                  status: "500IS",
                                  message: "Internal Server : " + error,
                                });
                                return;
                              } else {
                                connectionCustomer.execute(
                                  "INSERT INTO " +
                                    roleUser +
                                    " (Title,Firstname,Lastname,Username,Email,Birthday,Tel,HomeNo,Soi,Road,Subdistrict,District,Province,ZipCode,IDCard) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
                                  ],
                                  function (error) {
                                    if (error) {
                                      console.log("error condition");
                                      connectionUser.execute(
                                        "DELETE FROM user WHERE Username=?",
                                        [req.body.Username],
                                        function (error, result) {
                                          console.log("delete user", result);
                                          if (error) {
                                            res.json({
                                              status: "500IS",
                                              message:
                                                "Internal Server : " + error,
                                            });
                                            return;
                                          }
                                        }
                                      );
                                      res.json({
                                        status: "500IS",
                                        message: "Internal Server : " + error,
                                      });
                                      return;
                                    }
                                    if (
                                      req.body.wantToBeSeller != null &&
                                      req.body.wantToBeSeller == "Yes"
                                    ) {
                                      connectionCustomer.execute(
                                        "UPDATE seller_account SET URLImage=? , Storename=?,Status='sellerIdentity' WHERE Username=?",
                                        [
                                          req.body.URLImage,
                                          req.body.Firstname,
                                          req.body.Username,
                                        ],
                                        function (error) {
                                          if (error) {
                                            res.json({
                                              status: "500IS",
                                              message:
                                                "Internal Server : " + error,
                                            });
                                            return;
                                          }
                                        }
                                      );
                                    }
                                    res.json({
                                      status: "200OK",
                                      message: "Register Success",
                                    });
                                  }
                                );
                              }
                            }
                          );
                        }
                      );
                    }
                  }
                }
              );
            }
          }
        }
      ); //seller
    }
  } catch (error) {
    console.log("catch error");
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const registerAdmin = (req, res) => {
  bcrypt.hash(req.body.Password, saltRounds, function (error, hash) {
    connectionUser.execute(
      "INSERT INTO user (Username,Password,Role) VALUES (?,?,?)",
      [req.body.Username, hash, req.body.Role],
      function (error) {
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          return;
        } else {
          connectionAdmin.execute(
            "INSERT INTO account (Title,Firstname,Lastname,Username,Email,Birthday,Tel,HomeNo,Soi,Road,Subdistrict,District,Province,ZipCode,IDCard,URL_image_profile) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
            function (error) {
              res.json({
                status: "200OK",
                message: "Register admin Success!!",
              });
            }
          );
        }
      }
    );
  });
};

const logout = (req, res) => {
  console.log(req.body.token);
  try {
    let validateData = {
      token: req.body.token,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username } = decoded;
      connectionUser.execute(
        "SELECT * FROM user WHERE Username=?",
        [username],
        function (error, users, fields) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          }
          if (users.length == 0) {
            res.json({ status: "200NF", message: "no user found" });
            return;
          }
          res.json({ status: "200OK", message: "Logout success" });
        }
      );
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const customerUpdateAccount = (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
    };
    if (req.params.action == "ChangeImage") {
      validateData["URLImage_Profile"] = req.body.URL_image_profile;
    } else if (req.params.action == "ChangeAccountInfo") {
    } else {
      res.json({
        status: "404UC",
        message: "Unknown Command: " + req.params.action,
      });
      return;
    }
    console.log(req.body)
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
      return;
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "customer") {
        connectionUser.execute(
          "SELECT * FROM user WHERE Username=?",
          [username],
          function (error, users) {
            if (error) {
              res.json({
                status: "500IS",
                message: "Internal Server : " + error,
              });
              return;
            }
            if (users.length == 0) {
              res.json({ status: "200NF", message: "No User Found" });
              return;
            } else {
              if (req.params.action == "ChangeImage") {
                
                connectionCustomer.execute(
                  "UPDATE customer_account SET URL_image_profile=? WHERE Username=? ",
                  [req.body.URL_image_profile, username],
                  function (error) {
                    if (error) {
                      res.json({
                        status: "500IS",
                        message: "Internal Server : " + error,
                      });
                      return;
                    }
                    res.json({
                      status: "200OK",
                      message: "Customer update URLImage success",
                    });
                  }
                );
              } else if (req.params.action == "ChangeAccountInfo") {
                // console.log(req.body)
                connectionCustomer.execute(
                  "UPDATE customer_account SET Firstname=?,Lastname=?,Email=?,Tel=?,HomeNo=?,Soi=?,Road=?,Subdistrict=?,District=?,Province=?,ZipCode=? WHERE Username=?",
                  [
                    req.body.Firstname,
                    req.body.Lastname,
                    req.body.Email,
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
                  function (error) {
                    if (error) {
                      res.json({
                        status: "500IS",
                        message: "Internal Server : " + error,
                      });
                      return;
                    } else {
                      res.json({
                        status: "200OK",
                        message: "Customer update account success",
                      });
                    }
                  }
                );
              }
            }
          }
        );
      } else {
        res.json({
          status: "401UR",
          message: "Unauthorized",
        });
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const sellerUpdateAccount = (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
    };
    if (req.params.action == "ChangeBankInfo") {
      validateData["Bank_Account"] = req.body.Bank_Account;
      validateData["Bank_Account_Number"] = req.body.Bank_Account_Number;
      validateData["Bank_Account_Name"] = req.body.Bank_Account_Name;
    } else if (req.params.action == "ChangeImage") {
      validateData["URLImage_Profile"] = req.body.URL_image_profile;
    } else if (req.params.action == "ChangeAccountInfo") {
    } else {
      res.json({
        status: "404UC",
        message: "Unknown Command: " + req.params.action,
      });
      return;
    }
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "seller") {
        connectionUser.execute(
          "SELECT * FROM user WHERE Username=?",
          [username],
          function (error, users) {
            if (error) {
              res.json({
                status: "500IS",
                message: "Internal Server : " + error,
              });
              return;
            }
            if (users.length == 0) {
              res.json({ status: "200NF", message: "No User Found" });
              return;
            } else {
              if (req.params.action == "ChangeBankInfo") {
                connectionCustomer.execute(
                  "UPDATE seller_account SET Bank_Account=?,Bank_Account_Number=?,Bank_Account_Name=? WHERE Username=? ",
                  [
                    req.body.Bank_Account,
                    req.body.Bank_Account_Number,
                    req.body.Bank_Account_Name,
                    username,
                  ],
                  function (error) {
                    if (error) {
                      res.json({
                        status: "500IS",
                        message: "Internal Server : " + error,
                      });
                      return;
                    }
                    res.json({
                      status: "200OK",
                      message: "Seller update bank success!!",
                    });
                  }
                );
              } else if (req.params.action == "ChangeImage") {
                connectionCustomer.execute(
                  "UPDATE seller_account SET URL_image_profile=? WHERE Username=? ",
                  [req.body.URL_image_profile, username],
                  function (error) {
                    if (error) {
                      res.json({
                        status: "500IS",
                        message: "Internal Server : " + error,
                      });
                      return;
                    }
                    res.json({
                      status: "200OK",
                      message: "Seller update URLImage success!!",
                    });
                  }
                );
              } else if (req.params.action == "ChangeAccountInfo") {
                connectionCustomer.execute(
                  "UPDATE seller_account SET Title=?,Firstname=?,Lastname=?,Email=?,Birthday=?,Tel=?,HomeNo=?,Soi=?,Road=?,Subdistrict=?,District=?,Province=?,ZipCode=?,Storename=? WHERE Username=?",
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
                    req.body.Storename,
                    username,
                  ],
                  function (error) {
                    if (error) {
                      res.json({
                        status: "500IS",
                        message: "Internal Server : " + error,
                      });
                      return;
                    } else {
                      res.json({
                        status: "200OK",
                        message: "Seller update account success!!",
                      });
                    }
                  }
                );
              }
            }
          }
        );
      } else {
        res.json({
          status: "401UR",
          message: "Unauthorized",
        });
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const getCustomerAccount = (req, res) => {
  try {
    let validateData = {
      token: req.params.token,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
      return;
    } else {
      const decoded = jwt.verify(req.params.token, secret);
      const { username, role } = decoded;
      if (role == "customer") {
        connectionCustomer.execute(
          "select * from customer_account where username=?",
          [username],
          function (error, result) {
            if (error) {
              res.json({
                status: "500IS",
                message: "Internal Server : " + error,
              });
              return;
            } else if (result.length == 0) {
              res.json({
                status: "200NF",
                message: "username not found in customer account",
              });
            } else {
              let customer = {
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
                URLImage_Profile: result[0].URL_image_profile,
              };
              res.json({
                status: "200OK",
                message: "get data account success!!",
                customerAccount: customer,
              });
            }
          }
        );
      } else {
        res.json({
          status: "401UR",
          message: "Unauthorized",
        });
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const getSellerAccount = (req, res) => {
  try {
    let validateData = {
      token: req.params.token,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
      return;
    } else {
      const decoded = jwt.verify(req.params.token, secret);
      const { username, role } = decoded;
      if (role == "seller") {
        connectionCustomer.execute(
          "select * from seller_account where username=?",
          [username],
          function (error, result) {
            if (error) {
              res.json({
                status: "500IS",
                message: "Internal Server : " + error,
              });
              return;
            } else if (result.length == 0) {
              res.json({
                status: "200NF",
                message: "username not found in seller account",
              });
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
                Storename: result[0].Storename,
                URLImage: result[0].URL_image_profile,
              };
              res.json({
                status: "200OK",
                message: "get data account success!!",
                sellerAccount: seller,
              });
            }
          }
        );
      } else {
        res.json({
          status: "401UR",
          message: "Unauthorized",
        });
      }
    }
  } catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
};

const getBankSeller = (req, res) => {
  try {
    let validateData = {
      token: req.params.token,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
      return;
    } else {
      const decoded = jwt.verify(req.params.token, secret);
      const { username, role } = decoded;
      if (role == "seller") {
        connectionCustomer.execute(
          "select * from seller_account where username=?",
          [username],
          function (error, result) {
            if (error) {
              res.json({
                status: "500IS",
                message: "Internal Server : " + error,
              });
              return;
            } else if (result.length == 0) {
              res.json({
                status: "200NF",
                message: "username not found in seller account",
              });
            } else {
              let sellerBank = {
                Bank_Account: result[0].Bank_Account,
                Bank_Account_Name: result[0].Bank_Account_Name,
                Bank_Account_Number: result[0].Bank_Account_Number,
              };
              res.json({
                status: "200OK",
                message: "get Seller Bank Success",
                sellenBack: sellerBank,
              });
            }
          }
        );
      } else {
        res.json({
          status: "401UR",
          message: "Unauthorized",
        });
      }
    }
  } catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  sellerUpdateAccount,
  getSellerAccount,
  getBankSeller,
  getCustomerAccount,
  customerUpdateAccount,
  registerAdmin,
};

const CheckUsernameEmailError = (results, req, res) => {
  try {
    if (results.length > 0) {
      results.forEach((element) => {
        if (
          element.Username.toLowerCase() == req.body.Username.toLowerCase() &&
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
          element.Username.toLowerCase() == req.body.Username.toLowerCase()
        ) {
          res.json({
            status: "200UE",
            message: "Duplicate Username",
          });
          return;
        }
      });
    }
  } catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
};
