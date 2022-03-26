var jwt = require("jsonwebtoken");
const secret = "Login";

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

const add_cart = (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    let customerID = -1;
    let sellerID = -1;
    if (role == "customer") {
      connectionCustomer.execute(
        "SELECT * FROM customer_account WHERE Username=? ",
        [username],
        function (err, results) {
          if (err) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + err,
            });
            return;
          } else {
            customerID = results[0].CID;
            connectionCustomer.execute(
              "SELECT * FROM seller_account WHERE Storename=? ",
              [req.body.Storename],
              function (err, results) {
                if (err) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + err,
                  });
                  return;
                } else {
                  sellerID = results[0].SID;
                  connectionOrder.execute(
                    "INSERT INTO cart (Number_lottery,set_Lottery,SID,CID) VALUES (?,?,?,?)",
                    [
                      req.body.Number_lottery,
                      req.body.set_Lottery,
                      sellerID,
                      customerID,
                    ],
                    function (err) {
                      if (err) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + err,
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
        "SELECT * FROM customer_account WHERE Username=? ",
        [username],
        function (err, results) {
          if (err) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + err,
            });
            return;
          } else {
            customerID = results[0].CID;
            connectionOrder.execute(
              "SELECT * FROM cart WHERE CID=? ",
              [customerID],
              function (err, results) {
                if (err) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + err,
                  });
                  return;
                } else {
                  connectionCustomer.execute(
                    "SELECT * FROM seller_account WHERE SID=? ",
                    [results[0].SID],
                    function (err, results) {
                      if (err) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + err,
                        });
                        return;
                      } else {
                        connectionOrder.execute(
                          "SELECT * FROM cart WHERE CID=? ",
                          [customerID],
                          function (err, cart_) {
                            if (err) {
                              res.json({
                                status: "500IS",
                                message: "Internal Server : " + err,
                              });
                              return;
                            } else {
                              let cart = {
                                Storename: results[0].Storename,
                                Number_lottery: cart_[0].Number_lottery,
                                set_Lottery: cart_[0].set_Lottery,
                              };
                              res.json({
                                status: "200OK",
                                message: "get cart success",
                                Cart: cart,
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

module.exports = {
  add_cart,
  get_cart,
};
