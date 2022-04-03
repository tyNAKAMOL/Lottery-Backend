var jwt = require("jsonwebtoken");
const secret = "Login";
var moment = require("moment");

const mysql = require("mysql2");
const connectionOrder = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "order",
});

const connectionCustomer = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "customer",
});

const connectionCommon = mysql.createConnection({
  host: "localhost",
  user: "root",
});
const connectionLottery = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "lottery",
});

const add_cart = (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    let customerID = -1;
    let sellerID = -1;
    let lotteryPack = "";
    if (role == "customer") {
      connectionCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username],
        function (error, results) {
          if (error) {
            console.log("error CID");
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            customerID = results[0].CID;
            if (req.body.Pack_Flag != "") {
              lotteryPack = req.body.Pack_Flag;
            }
            connectionCustomer.execute(
              "SELECT SID FROM seller_account WHERE Storename=? ",
              [req.body.Storename],
              function (error, results) {
                if (error) {
                  console.log("error SID");
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                  return;
                } else {
                  sellerID = results[0].SID;
                  connectionOrder.execute(
                    "INSERT INTO cart (Number_lottery,Amount,SID,CID,Pack_Flag) VALUES (?,?,?,?,?)",
                    [
                      req.body.Number_lottery,
                      req.body.Amount,
                      sellerID,
                      customerID,
                      lotteryPack,
                    ],
                    function (error) {
                      if (error) {
                        console.log("error Cart");
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                        return;
                      } else {
                        res.json({
                          status: "200OK",
                          message: "Add lottery to cart success",
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else {
      res.json({
        status: "401UR",
        message: "Unauthorized",
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const get_cart = (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, secret);
    const { username, role } = decoded;
    let customerID = -1;
    if (role == "customer") {
      connectionCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username],
        function (error, results) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            customerID = results[0].CID;
            connectionOrder.execute(
              "SELECT * FROM cart WHERE CID=? ",
              [customerID],
              function (error, results) {
                if (error) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                  return;
                } else {
                  connectionCustomer.execute(
                    "SELECT * FROM seller_account WHERE SID=? ",
                    [results[0].SID],
                    function (error, results) {
                      if (error) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                        return;
                      } else {
                        connectionCommon.execute(
                          " SELECT a.Number_lottery, a.Amount,a.Pack_Flag, b.Storename FROM order.cart a JOIN customer.seller_account b on a.SID = b.SID where a.CID=?",
                          [customerID],
                          function (error, cart_) {
                            console.log(cart_);
                            if (error) {
                              res.json({
                                status: "500IS",
                                message: "Internal Server : " + error,
                              });
                              return;
                            } else {
                              res.json({
                                status: "200OK",
                                message: "get cart success",
                                Cart: cart_,
                              });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else {
      res.json({
        status: "401UR",
        message: "Unauthorized",
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const update_cart = (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      connectionCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username],
        function (error, results) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
          } else {
            connectionOrder.execute(
              "SELECT Number_lottery , Amount FROM cart WHERE CID = ? and Number_lottery = ?",
              [results[0].CID, req.body.Number_lottery],
              function (error) {
                if (error) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                } else {
                  connectionOrder.execute(
                    "UPDATE cart SET Amount=? WHERE Number_lottery=? ",
                    [req.body.Amount, req.body.Number_lottery],
                    function (error) {
                      if (error) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                      } else {
                        res.json({
                          status: "200OK",
                          message: "customer update amount success!!",
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else {
      res.json({
        status: "401UR",
        message: "Unauthorized",
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const delete_cart = (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      connectionCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username],
        function (error, results) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
          } else {
            connectionOrder.execute(
              "SELECT * FROM cart WHERE CID = ? and Number_lottery = ?",
              [results[0].CID, req.body.Number_lottery],
              function (error) {
                if (error) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                } else {
                  connectionOrder.execute(
                    "DELETE FROM cart WHERE Number_lottery=? ",
                    [req.body.Number_lottery],
                    function (error) {
                      if (error) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                      } else {
                        res.json({
                          status: "200OK",
                          message:
                            "customer remove lottery from cart success!!",
                        });
                      }
                    }
                  );
                }
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

const confirmed_order = (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      connectionCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username],
        function (error, results) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
          } else {
            connectionOrder.execute(
              "INSERT INTO order_c (OrderDate,Payment,Status,CID) VALUES (?,?,?,?)",
              [
                moment(new Date()).format("YYYYMMDDHHmmssZZ"),
                "Transfer",
                "Order Confirmed",
                results[0].CID,
              ],
              function (error) {
                if (error) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                } else {
                  connectionOrder.execute(
                    "SELECT * FROM cart WHERE CID=?",
                    [results[0].CID],
                    function (error, orderInCart) {
                      if (error) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                      } else {
                        orderInCart.forEach((element) => {
                          // console.log(orderInCart)
                          if (
                            element.Pack_Flag != null &&
                            element.Pack_Flag == "Y"
                          ) {
                            connectionLottery.execute(
                              "UPDATE packlottery SET Status=? WHERE Number=?",
                              ["Reserved", element.Number]
                            );
                          }
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else {
      res.json({
        status: "401UR",
        message: "Unauthorized",
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

module.exports = {
  add_cart,
  get_cart,
  update_cart,
  delete_cart,
  confirmed_order,
};

const createOrder = async (req, res, results) => {
  try {
    await connectionOrder.execute(
      "INSERT INTO order_c (OrderDate,Payment,Status,CID) VALUES (?,?,?,?)",
      [
        moment(new Date()).format("YYYYMMDDHHmmssZZ"),
        "Transfer",
        "Order Confirmed",
        results[0].CID,
      ],
      function (error) {
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
        } else {
          connectionOrder.execute(
            "SELECT OID FROM order_c WHERE Status='Order Confirmed' and CID=?",
            [results[0].CID],
            function (error, resultOID) {
              if (error) {
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + error,
                });
              } else {
                return resultOID[0].OID;
              }
            }
          );
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const OrderConfirmedCart = (req, res,results) => {
  try {
    connectionOrder.execute(
      "SELECT * FROM cart WHERE CID=?",
      [results[0].CID],
      function (error, orderInCart) {
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
        } else {
          return orderInCart
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};
const OrderConfirmedLottery = async(req, res, orderList) => {
  let lotteryOrderList = []
  let errorOrderList = []
  let countAmount = 0
  try {
    if(orderList != null){
      await orderList.forEach(async(element)=>{
        if (
          element.Pack_Flag != null &&
          element.Pack_Flag == "Y"
        ) {
          await connectionLottery.execute(
            "SELECT * FROM packlottery WHERE status='Available' and Number=?",
            [element.Number],
            async function (error, results) {
              if (error) {
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + error,
                });
              } else {
                if(results.length>=element.Amount){
                  for(let i=0 ; i < element.Amount ; i++){
                   await connectionLottery.execute(
                      "UPDATE packlottery SET Status=? WHERE Number=? and Lot=? and Draw=?",
                      ["reserved",results[i].Number,results[i].Lot,results[i].Draw],
                      function (error, results) {
                        if (error) {
                          res.json({
                            status: "500IS",
                            message: "Internal Server : " + error,
                          });
                        } else {
                          lotteryOrderList.push(results[i]);
                        }
                      }
                    );
                  }
                }
                else{
                  errorOrderList.push({
                    "Number": element.Number,
                    "Amount": element.Amount,
                    "Stock": results.length
                  });
                }
              }
            }
          );
        }else{
          await connectionLottery.execute(
            "SELECT * FROM singlelottery WHERE status='Available' and Number=?",
            [element.Number],
            async function (error, results) {
              if (error) {
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + error,
                });
              } else {
                for(let i=0 ; i < element.Amount ; i++){
                  await connectionLottery.execute(
                    "UPDATE singlelottery SET Status=? WHERE Number=? and Lot=? and Draw=?",
                    ["reserved",results[i].Number,results[i].Lot,results[i].Draw],
                    function (error, results) {
                      if (error) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                      } else {
                        lotteryOrderList.push(results[i]);
                      }
                    }
                  );
                }
              }
            }
          );
        }
        countAmount = countAmount + element.Amount;
      })
      if(countAmount == lotteryOrderList.length){
        return lotteryOrderList;
      }  
    }
    return lotteryOrderList=[];
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};
