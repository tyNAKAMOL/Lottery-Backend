var jwt = require("jsonwebtoken");
const secret = "Login";
var moment = require("moment");

const mysql = require("mysql2");
const connectionOrder = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "order",
});
const promiseOrder = connectionOrder.promise();

const connectionCustomer = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "customer",
});
const promiseCustomer = connectionCustomer.promise();

const connectionCommon = mysql.createConnection({
  host: "localhost",
  user: "root",
});
const promiseCommon = connectionCommon.promise();

const connectionLottery = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "lottery",
});
const promiseLottery = connectionLottery.promise();

const validateMethod = (vd) => {
  let errMsg = "";
  for (const [key, value] of Object.entries(vd)) {
    if (value == null || value == "" || value == []) {
      errMsg += key + " ";
    }
  }
  return errMsg;
};

const add_cart = async (req, res) => {
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
      return;
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      let lotteryPack = ""; // -> singleLottery send "N"
      if (role == "customer") {
        const [customerID] = await promiseCustomer.execute(
          "SELECT CID FROM customer_account WHERE Username=? ",
          [username]
        );
        const [sellerID] = await promiseCustomer.execute(
          "SELECT SID FROM seller_account WHERE Storename=? ",
          [req.body.Storename]
        );
        let params = {
          Number: req.body.Number_lottery,
          Amount: req.body.Amount,
          sellerID: sellerID[0].SID,
          customerID: customerID[0].CID,
          lotteryPack: req.body.Pack_Flag,
        };
        console.log(params);
        let addCartSuccess = await checkErrorAddCart(req, res, params);
        if (addCartSuccess) {
          res.json({
            status: "200OK",
            message: "Add lottery to cart success!!",
          });
        }
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

const get_cart = async (req, res) => {
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
        const [customerID] = await promiseCustomer.execute(
          "SELECT CID FROM customer_account WHERE Username=? ",
          [username]
        );
        if (customerID[0].CID != undefined) {
          const [cart_] = await promiseCommon.execute(
            " SELECT a.Number_lottery, a.Amount,a.Pack_Flag, b.Storename FROM order.cart a JOIN customer.seller_account b on a.SID = b.SID where a.CID=?",
            [customerID[0].CID]
          );
          res.json({
            status: "200OK",
            message: "get cart success",
            Cart: cart_,
          });
        } else {
          res.json({
            status: "401UR",
            message: "Unauthorized",
          });
        }
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const update_cart = async (req, res) => {
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
      return;
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "customer") {
        const [customerID] = await promiseCustomer.execute(
          "SELECT CID FROM customer_account WHERE Username=? ",
          [username]
        );
        if (
          req.body.errorOrderList.length != 0 &&
          customerID[0].CID != undefined
        ) {
          for (let i = 0; i < req.body.errorOrderList.length; i++) {
            const [orderInCart] = await promiseOrder.execute(
              "SELECT Number_lottery , Amount FROM cart WHERE CID = ? and Number_lottery = ? and SID=?",
              [
                customerID[0].CID,
                req.body.errorOrderList[i].Number_lottery,
                req.body.errorOrderList[i].SID,
              ]
            );
            if (orderInCart.length != 0) {
              await promiseOrder.execute(
                "UPDATE cart SET Amount=? WHERE CID = ? and Number_lottery = ? and SID=? ",
                [
                  req.body.errorOrderList[i].Stock,
                  customerID[0].CID,
                  req.body.errorOrderList[i].Number_lottery,
                  req.body.errorOrderList[i].SID,
                ]
              );
            }
            res.json({
              status: "200OK",
              message: "customer update amount success!!",
            });
          }
        } else {
          res.json({
            status: "403MP",
            message: "Missing or invalid Parameter : [errorOrderList is null]",
          });
        }
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

const delete_cart = async (req, res) => {
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
      return;
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "customer") {
        const [customerID] = await promiseCustomer.execute(
          "SELECT CID FROM customer_account WHERE Username=? ",
          [username]
        );
        const [sellerID] = await promiseCustomer.execute(
          "SELECT * FROM seller_account WHERE Storename=? ",
          [req.body.Storename]
        );
        if (customerID != undefined && sellerID != undefined) {
          await promiseOrder.execute(
            "DELETE FROM cart WHERE Number_lottery=? and SID=? and CID=?",
            [req.body.Number_lottery, sellerID[0].SID, customerID[0].CID]
          );
          res.json({
            status: "200OK",
            message: "customer remove lottery from cart success!!",
          });
        }
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const confirmed_order = async (req, res) => {
  try {
    let validateToken = {
      token: req.body.token,
    };
    let errMsgCart = "";
    let validateDataInCart = [];
    //  console.log(req.body.lotteryList);
    for (const element of req.body.lotteryList) {
      // validateDataInCart.push({
      //   storeName : element.storeName,
      //   Number : element.Number_lottery,
      //   Draw : element.Draw,
      //   DrawDate : element.DrawDate,
      //   Pack : element.Pack,
      //   Amount : element.Amount,
      //   Money : element.Money
      // })

      let param = {
        storeName: element.Storename,
        Number: element.Number,
        Draw: element.Draw,
        DrawDate: element.DrawDate,
        Storename: element.Storename,
        Pack: element.pack,
        Amount: element.Amount,
        Money: element.Money,
      };
      errMsgCart += validateMethod(param);
    }
    const errMsg = validateMethod(validateToken);
    if (errMsg.length > 0 || errMsgCart.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg + errMsgCart,
      });
      return;
    } else {
      var sellerMap = new Map();

      // let List_ = []
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "customer") {
        const [results] = await promiseCustomer.execute(
          "SELECT CID FROM customer_account WHERE Username=?",
          [username]
        );
        for (let element of req.body.lotteryList) {
          let sellerMapList = [];
          if (sellerMap.has(element.Storename)) {
            sellerMapList = sellerMap.get(element.Storename);
            sellerMapList.push({
              Number: element.Number,
              Draw: element.Draw,
              DrawDate: element.DrawDate,
              Pack: element.pack,
              Storename: element.Storename,
              Amount: element.Amount,
              Money: element.Money,
            });
            sellerMap.set(element.Storename, sellerMapList);
          } else {
            sellerMapList.push({
              Number: element.Number,
              Draw: element.Draw,
              DrawDate: element.DrawDate,
              Pack: element.pack,
              Storename: element.Storename,
              Amount: element.Amount,
              Money: element.Money,
            });
            sellerMap.set(element.Storename, sellerMapList);
          }
        }
        let subTotal = 0;
        let firstShippingCharge = true;
        let firstOrder = true;
        let relatedID = "";
        let shippingCost = "";
        let infoOrderList_ = [];
        for (const [key, value] of sellerMap.entries()) {
          if (value.length > 1) {
            for (let i = 0; i < value.length; i++) {
              subTotal += parseInt(value[i].Money);
            }
          } else {
            subTotal = parseInt(value[0].Money);
          }

          if (req.body.delivery == "Yes" && firstShippingCharge) {
            shippingCost = "40";
            firstShippingCharge = false;
          } else {
            shippingCost = "-";
          }
          let params = {
            OrderDate: moment(new Date()).format("YYYYMMDDHHmmssZZ"),
            Payment: "Transfer",
            Money: String(subTotal),
            Status: "Order Confirmed",
            customerID: results[0].CID,
            ShippingCost: shippingCost,
            relatedID: relatedID,
            ShippingFlag: req.body.delivery,
          };
          let addOrder = await checkAddOrder(req, res, params);
          if (addOrder.flag && addOrder.OID != "") {
            if (firstOrder) {
              relatedID = addOrder.OID;
              firstOrder = false;
            }
          }
          infoOrderList_ = await OrderConfirmedLottery(
            req,
            res,
            value,
            addOrder.OID,
            infoOrderList_
          );
          // console.log("in loop",infoOrderList_);
        }
        // console.log("out loop",infoOrderList_)
        if (infoOrderList_.length > 0) {
          await confirmedPayment(req, res, infoOrderList_, relatedID);
        }
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

const update_URLSlip = async (req, res) => {
  const lotteryList = [];
  try {
    let validateData = {
      token: req.body.token,
      OrderID: req.body.OrderID,
      URLSlip: req.body.URLSlip,
    };
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
        const [status] = await promiseOrder.execute(
          "SELECT * FROM order_c WHERE OID=? or relateId=?",
          [req.body.OrderID, req.body.OrderID]
        );
        if (status[0].Status == "Pending Payment") {
          await promiseOrder.execute(
            "UPDATE order_c SET URLSlip=?, Status='Audit Payment' WHERE Status='Pending Payment' and (OID = ? or relateId = ?)",
            [req.body.URLSlip, req.body.OrderID, req.body.OrderID]
          );
          for (let i = 0; i < status.length; i++) {
            const [single] = await promiseLottery.execute(
              "SELECT * FROM singlelottery WHERE OID=?",
              [status[i].OID]
            );
            const [pack] = await promiseLottery.execute(
              "SELECT * FROM packlottery WHERE OID=?",
              [status[i].OID]
            );
            if (single.length > 0) {
              for (let i = 0; i < single.length; i++) {
                lotteryList.push(single[i]);
              }
            }
            if (pack.length > 0) {
              for (let i = 0; i < pack.length; i++) {
                lotteryList.push(pack[i]);
              }
            }
          }
          console.log(lotteryList);
          let addTransaction = await checkAddTransaction(req, res, lotteryList);
          if (addTransaction) {
            await promiseOrder.execute("DELETE FROM cart WHERE CID=?", [
              status[0].CID,
            ]);
            res.json({
              status: "200OK", //can update
              message: "update URLSlip success!!",
            });
            return;
          }
        } else if (status[0].Status == "RePending Payment") {
          await promiseOrder.execute(
            "UPDATE order_c SET URLSlip=?, Status='Audit Payment' WHERE Status='RePending Payment' and (OID = ? or relateId = ?)",
            [req.body.URLSlip, req.body.OrderID, req.body.OrderID]
          );
          res.json({
            status: "200OK", //can update
            message: "update URLSlip success!!",
          });
          return;
        } else {
          res.json({
            status: "200CU", //cannot update
            message:
              "cannot update URLSlip because orderStatus: " + status[0].Status,
          });
        }
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const getSellerCheckOrder = async (req, res) => {
  try {
    let order = [];
    let validateData = {
      token: req.params.token, //seller
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
        const [SID] = await promiseCustomer.execute(
          "SELECT SID FROM seller_account WHERE Username=?",
          [username]
        );
        const [result] = await promiseOrder.execute(
          "SELECT * FROM order_c INNER JOIN transaction on order_c.OID = transaction.OID where transaction.SID = ?",
          [SID[0].SID]
        );
        if (result.length == 0) {
          res.json({
            status: "200NF",
            message: "not found in order",
          });
        } else {
          for (let i = 0; i < result.length; i++) {
            order.push({
              orderID: result[i].OID,
              customerID: result[i].CID,
              nameCustomer: await getName(result[i].CID, "customer", "CID"),
              Number: result[i].Number_lottery,
              Lot: result[i].Lot,
              Draw: result[i].Draw,
              OrderDate: result[i].OrderDate,
            });
          }
          res.json({
            status: "200OK",
            message: "get orderPayment success!!",
            orderPayment: order,
          });
        }
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

const updateSellerCheckOrder = async (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
      checkLotteryList: req.body.lotteryList,
      orderID: req.body.orderID,
    };
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
      let countApprove = 0;
      if (role == "seller") {
        for (const element of req.body.lotteryList) {
          if (element.approve == "Yes") {
            countApprove = countApprove + 1;
            await promiseLottery.execute(
              "UPDATE singlelottery SET Status='Sold Out' WHERE OID = ? and Number=? and Lot=? and Draw=?",
              [req.body.orderID, element.Number, element.Lot, element.Draw]
            );
            await promiseLottery.execute(
              "UPDATE packlottery SET Status='Sold Out' WHERE OID = ? and Number=? and Lot=? and Draw=? ",
              [req.body.orderID, element.Number, element.Lot, element.Draw]
            );
          } else {
            await promiseLottery.execute(
              "UPDATE singlelottery SET Status='Cancelled' WHERE OID = ? and Number=? and Lot=? and Draw=?",
              [req.body.orderID, element.Number, element.Lot, element.Draw]
            );
            await promiseLottery.execute(
              "UPDATE packlottery SET Status='Cancelled' WHERE OID = ? and Number=? and Lot=? and Draw=?",
              [req.body.orderID, element.Number, element.Lot, element.Draw]
            );
          }
        }
        let Refund = (req.body.lotteryList.length - countApprove) * 80;
        const [delivery] = await promiseOrder.execute(
          "SELECT ShippingFlag FROM order_c WHERE OID=?",
          [req.body.orderID]
        );
        if (countApprove > 0) {
          let status =
            delivery[0].ShippingFlag == "Yes" ? "Order Packing" : "Completed";
          await promiseOrder.execute(
            "UPDATE order_c SET Status = ?, Refund=? WHERE Status='Seller Check Order' and OID = ?",
            [status, Refund, req.body.orderID]
          );
        } else {
          await promiseOrder.execute(
            "UPDATE order_c SET Status = 'Canceled', Refund=? WHERE Status='Seller Check Order' and OID = ?",
            [Refund, req.body.orderID]
          );
        }
      }
      res.json({
        status: "200OK",
        message: "Success",
      });
    }
    // }
  } catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
};

const randomLottery = async (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
      Amount: req.body.Amount,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "customer") {
        const [results] = await promiseLottery.execute(
          "SELECT * FROM singlelottery where Status='Available' "
        );
        if (results.length >= req.body.Amount) {
          const [lottery] = await promiseLottery.execute(
            "SELECT * FROM singlelottery where Status='Available' ORDER BY RAND() LIMIT " +
              req.body.Amount
          );
          let lotteryMap = new Map();
          for (const element of lottery) {
            //xxxxxx|yyy
            if (!lotteryMap.has(element.Number + "|" + element.SID)) {
              lotteryMap.set(element.Number + "|" + element.SID, "1");
            } else {
              let num =
                parseInt(lotteryMap.get(element.Number + "|" + element.SID)) +
                1;
              lotteryMap.set(element.Number + "|" + element.SID, String(num));
            }
          }
          for (const [key, value] of lotteryMap.entries()) {
            let temp = key.split("|");
            checkErrorAddCart(req, res, {
              Number: temp[0],
              Amount: value, //
              sellerID: temp[1],
              customerID: await getID(username, "customer", "Username"),
              lotteryPack: "N",
            });
          }
          console.log(lotteryMap);
          res.json({
            status: "200OK",
            message: "Success",
          });
        } else {
          res.json({
            status: "200CR",
            message: "Cannot Random because lottery is not enough.",
          });
        }
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

module.exports = {
  add_cart,
  get_cart,
  update_cart,
  delete_cart,
  confirmed_order,
  update_URLSlip,
  getSellerCheckOrder,
  updateSellerCheckOrder,
  randomLottery,
};

const getName = async (ID, role, key) => {
  const [FullName] = await promiseCustomer.execute(
    "SELECT Firstname,Lastname FROM " + role + "_account WHERE " + key + "=?",
    [ID]
  );
  let fullName = FullName[0].Firstname + " " + FullName[0].Lastname;
  return fullName;
};
const getID = async (username, role, key) => {
  const [ID] = await promiseCustomer.execute(
    "SELECT CID FROM " + role + "_account WHERE " + key + "=?",
    [username]
  );
  console.log(ID)
  return ID[0].CID;
};

const checkErrorAddCart = async (req, res, params) => {
  let errInCart = "";
  for (const [key, value] of Object.entries(params)) {
    if (value == "" || value == null) {
      errInCart += key;
    }
  }
  if (errInCart.length > 0) {
    res.json({
      status: "403MP",
      message: "Missing or Invalid Parameter : " + errInCart,
    });
    return false;
  } else {
    await promiseOrder.execute(
      "INSERT INTO cart (Number_lottery,Amount,SID,CID,Pack_Flag) VALUES (?,?,?,?,?)",
      [
        params.Number,
        params.Amount,
        params.sellerID,
        params.customerID,
        params.lotteryPack,
      ]
    );
  }
  return true;
};

const checkAddOrder = async (req, res, params) => {
  let errInOrder = "";
  let orderResult = {
    flag: true,
    OID: "",
  };
  for (const [key, value] of Object.entries(params)) {
    if ((value == "" || value == null) && key != "relatedID") {
      errInOrder += key;
    }
  }
  if (errInOrder.length > 0) {
    res.json({
      status: "403MP",
      message: "Missing or Invalid Parameter : " + errInOrder,
    });
    orderResult.flag = false;
    return orderResult;
  } else {
    const [result] = await promiseOrder.execute(
      "INSERT INTO order_c (OrderDate,Payment,Money,Status,CID,ShippingCost,ShippingFlag,relateID) VALUES (?,?,?,?,?,?,?,?)",
      [
        params.OrderDate,
        params.Payment,
        params.Money,
        params.Status,
        params.customerID,
        params.ShippingCost,
        params.ShippingFlag,
        params.relatedID,
      ]
    );
    orderResult.OID = result.insertId;

    console.log(result);
  }
  return orderResult;
};

const checkAddTransaction = async (req, res, lotteryList) => {
  let errList = [];
  for (const element of lotteryList) {
    if (
      element.Number == "" ||
      element.Lot == "" ||
      element.Draw == "" ||
      element.DrawDate == "" ||
      element.SID == "" ||
      element.OID == ""
    ) {
      errList.push(element);
    }
  }
  if (errList.length > 0) {
    res.json({
      status: "403MP",
      message: "Missing or Invalid Parameter",
      errorList: errList,
    });
    return false;
  } else {
    for (const element of lotteryList) {
      await promiseOrder.execute(
        "INSERT INTO transaction (Number_lottery,Lot,Draw,DrawDate,SID,OID) VALUES (?,?,?,?,?,?)",
        [
          element.Number,
          element.Lot,
          element.Draw,
          element.DrawDate,
          element.SID,
          element.OID,
        ]
      );
    }
    return true;
  }
};

const getStorename = async (SID) => {
  const [storename] = await promiseCustomer.execute(
    "SELECT Storename FROM seller_account WHERE SID=?",
    [SID]
  );
  return storename[0].Storename;
};

const updateOutOfStock = async (Number, SID, CID) => {
  await promiseOrder.execute(
    "DELETE FROM cart WHERE Number_lottery=? and SID=? and CID=? ",
    [Number, SID, CID]
  );
};

const OrderConfirmedLottery = async (req, res, orderList, OID, infoList) => {
  let lotteryOrderList = infoList.length > 0 ? infoList[0].lotteryList : [];
  let errorOrderList = infoList.length > 0 ? infoList[0].errorList : [];
  let infoOrderList = [];
  try {
    if (orderList != null) {
      for (const element of orderList) {
        console.log("element", element);
        if (element.pack != null && element.pack == "Y") {
          console.log("pack!");
          const [packLottery] = await promiseLottery.execute(
            "SELECT * FROM packlottery WHERE status='Available' and Number=?",
            [element.Number]
          );
          const Storename = await getStorename(element.SID);
          if (packLottery.length > 0) {
            let orderSize =
              packLottery.length >= element.Amount
                ? element.Amount
                : packLottery.length;
            if (packLottery.length < element.Amount) {
              errorOrderList.push({
                Number: element.Number,
                Amount: element.Amount,
                Stock: packLottery.length,
                Storename: element.Storename,
                SID: element.SID,
                Status: "Changed Amount",
              });
            }
            for (let i = 0; i < orderSize; i++) {
              await promiseLottery.execute(
                "UPDATE packlottery SET Status=? , OID=? WHERE Number=? and Lot=? and Draw=?",
                [
                  "reserved",
                  OID,
                  packLottery[i].Number,
                  packLottery[i].Lot,
                  packLottery[i].Draw,
                ]
              );
              lotteryOrderList.push(packLottery[i]);
            }
          } else {
            errorOrderList.push({
              Number: element.Number,
              Amount: element.Amount,
              Stock: packLottery.length,
              Storename: element.Storename,
              SID: element.SID,
              Status: "Changed Amount",
            });
            updateOutOfStock(element.Number, element.SID, element.CID);
          }
        } else {
          console.log("single");
          const [singleLottery] = await promiseLottery.execute(
            "SELECT * FROM singlelottery WHERE status='Available' and Number=?",
            [element.Number]
          );
          console.log("singleLottery", singleLottery);
          if (singleLottery.length > 0) {
            let orderSize =
              singleLottery.length >= element.Amount
                ? element.Amount
                : singleLottery.length;
            if (singleLottery.length < element.Amount) {
              errorOrderList.push({
                Number: element.Number,
                Amount: element.Amount,
                Stock: singleLottery.length,
                Storename: element.Storename,
                SID: element.SID,
                Status: "Changed Amount",
              });
            }
            console.log("orderSize", orderSize);
            for (let i = 0; i < orderSize; i++) {
              await promiseLottery.execute(
                "UPDATE singlelottery SET Status='reserved' , OID=? WHERE Number=? and Lot=? and Draw=?",
                [
                  OID,
                  singleLottery[i].Number,
                  singleLottery[i].Lot,
                  singleLottery[i].Draw,
                ]
              );
              lotteryOrderList.push(singleLottery[i]);
              console.log("lotteryList loop", lotteryOrderList);
            }
            console.log("lotteryList", lotteryOrderList);
          } else {
            errorOrderList.push({
              Number: element.Number,
              Amount: element.Amount,
              Stock: singleLottery.length,
              Storename: element.Storename,
              SID: element.SID,
              Status: "Changed Amount",
            });
            updateOutOfStock(element.Number, element.SID, element.CID);
          }
        }
      }
      infoOrderList.push({
        lotteryList: lotteryOrderList,
        errorList: errorOrderList,
      });
      console.log("infoOrderList in function: ", infoOrderList[0].lotteryList);
    }
    return infoOrderList;
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const confirmedPayment = async (req, res, infoOrderList, OID) => {
  try {
    if (infoOrderList[0].errorList.length == 0) {
      await promiseOrder.execute(
        "UPDATE order_c SET Status='Pending Payment' WHERE OID=? or relateId =?",
        [OID, OID]
      );
      res.json({
        status: "200OK",
        message: "You can payment.",
        orderID: OID,
      });
    } else {
      await promiseOrder.execute(
        "UPDATE order_c SET Status='Pending Review' WHERE OID=? or relateId =?",
        [OID, OID]
      );
      res.json({
        status: "200CE", //check Error
        message: "Please review!",
        ListError: infoOrderList[0].errorList,
        orderID: OID,
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};
