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

const add_cart = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    let lotteryPack = "";
    if (role == "customer") {
      const [customerID] = await promiseCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username]
      );

      if (req.body.Pack_Flag != "") {
        lotteryPack = req.body.Pack_Flag;
      }
      const [sellerID] = await promiseCustomer.execute(
        "SELECT SID FROM seller_account WHERE Storename=? ",
        [req.body.Storename]
      );

      await promiseOrder.execute(
        "INSERT INTO cart (Number_lottery,Amount,SID,CID,Pack_Flag) VALUES (?,?,?,?,?)",
        [
          req.body.Number_lottery,
          req.body.Amount,
          sellerID[0].SID,
          customerID[0].CID,
          lotteryPack,
        ]
      );

      res.json({
        status: "200OK",
        message: "Add lottery to cart success",
      });
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

const get_cart = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      const [customerID] = await promiseCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username]
      );

      const [sellerID] = await promiseOrder.execute(
        "SELECT * FROM cart WHERE CID=? ",
        [customerID[0].CID]
      );

      await promiseCustomer.execute(
        "SELECT * FROM seller_account WHERE SID=? ",
        [sellerID[0].SID]
      );

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
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const update_cart = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      const [customerID] = await promiseCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username]
      );
      if (req.body.errorOrderList.length != 0) {
        for (let i = 0; i < req.body.errorOrderList.length; i++) {
          const [orderInCart] = await promiseOrder.execute(
            "SELECT Number_lottery , Amount FROM cart WHERE CID = ? and Number_lottery = ? and SID=?",
            [customerID[0].CID , req.body.errorOrderList[i].Number_lottery , req.body.errorOrderList[i].SID]
          );
          if (orderInCart.length != 0) {
            await promiseOrder.execute(
              "UPDATE cart SET Amount=? WHERE CID = ? and Number_lottery = ? and SID=? ",
              [req.body.errorOrderList[i].Stock, customerID[0].CID, req.body.errorOrderList[i].Number_lottery , req.body.errorOrderList[i].SID]
            );
          }
          res.json({
            status: "200OK",
            message: "customer update amount success!!",
          });
        }
      }
      else{
        res.json({
          status: "403MP",
          message: "Missing or invalid Parameter:[errorOrderList is null]",
        });
      }
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

const delete_cart = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      const [customerID] = await promiseCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=? ",
        [username]
      );

      const [sellerID] = await promiseCustomer.execute(
        "SELECT * FROM seller_account WHERE storename=? ",
        [req.body.Storename]
      );

      await promiseOrder.execute(
        "DELETE FROM cart WHERE Number_lottery=? and SID=? and CID=?",
        [req.body.Number_lottery, sellerID[0].SID, customerID[0].CID]
      );

      res.json({
        status: "200OK",
        message: "customer remove lottery from cart success!!",
      });
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const confirmed_order = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      const [results] = await promiseCustomer.execute(
        "SELECT CID FROM customer_account WHERE Username=?",
        [username]
      );
      await promiseOrder.execute(
        "INSERT INTO order_c (OrderDate,Payment,Money,Status,CID) VALUES (?,?,?,?,?)",
        [
          moment(new Date()).format("YYYYMMDDHHmmssZZ"),
          "Transfer",
          req.body.Money,
          "Order Confirmed",
          results[0].CID,
        ]
      );
      console.log("CID", results);
      const [OID] = await promiseOrder.execute(
        "SELECT OID FROM order_c WHERE Status='Order Confirmed' and CID=?",
        [results[0].CID]
      );
      console.log("OID", OID);
      const [orderInCart] = await promiseOrder.execute(
        "SELECT * FROM cart WHERE CID=?",
        [results[0].CID]
      );
      console.log("orderInCart", orderInCart);
      const infoOrderList_ = await OrderConfirmedLottery(req, res, orderInCart,OID[0].OID);
      console.log("infoOrderList -> ", infoOrderList_);
      await confirmedPayment(req, res, infoOrderList_, OID[0].OID);
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

const update_URLSlip = async (req, res) => {
  const lotteryList = []
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "customer") {
      const [status] = await promiseOrder.execute(
        "SELECT Status,CID FROM order_c WHERE OID=?",
        [req.body.OrderID]
      );
      if (status[0].Status == "Pending Payment") {
        await promiseOrder.execute(
          "UPDATE order_c SET URLSlip=?, Status='Audit Payment' WHERE Status='Pending Payment' and OID=?",
          [req.body.URLSlip, req.body.OrderID]
        );
        const[single] = await promiseLottery.execute(
          "SELECT * FROM singlelottery WHERE OID=?",
          [req.body.OrderID]
        )
        const[pack] = await promiseLottery.execute(
          "SELECT * FROM packlottery WHERE OID=?",
          [req.body.OrderID]
        )
        if(single.length>0){
          for(let i=0 ; i<single.length ; i++){
            lotteryList.push(single[i])
          }
        }
        if(pack.length>0){
          for(let i=0 ; i < pack.length ; i++){
            lotteryList.push(pack[i])
          }
        }
        console.log(lotteryList)
        for(const element of lotteryList){
          await promiseOrder.execute(
            "INSERT INTO transaction (Number_lottery,Lot,Draw,DrawDate,SID,OID) VALUES (?,?,?,?,?,?)",
            [element.Number,element.Lot,element.Draw,element.DrawDate,element.SID,element.OID]
          );
        }
        await promiseOrder.execute(
          "DELETE FROM cart WHERE CID=?",
          [status[0].CID]
        );
        res.json({
          status: "200OK", //can update
          message: "update URLSlip success!!",
        });
      } else {
        res.json({
          status: "200CU", //cannot update
          message:
            "cannot update URLSlip because orderStatus: " + status[0].Status,
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
};

const getSellerID = async (Storename) => {
  const [sellerID] = await promiseCustomer.execute(
    "SELECT SID FROM seller_account WHERE Storename=?",
    [Storename]
  );
  return sellerID[0].SID;
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

const OrderConfirmedLottery = async (req, res, orderList,OID) => {
  let lotteryOrderList = [];
  let errorOrderList = [];
  let infoOrderList = [];
  try {
    if (orderList != null) {
      for (const element of orderList) {
        console.log("element", element);
        if (element.Pack_Flag != null && element.Pack_Flag == "Y") {
          console.log("pack!");
          const [packLottery] = await promiseLottery.execute(
            "SELECT * FROM packlottery WHERE status='Available' and Number=?",
            [element.Number]
          );
          const storeName = await getStorename(element.SID)
          if (packLottery.length > 0) {
            let orderSize =
              packLottery.length >= element.Amount
                ? element.Amount
                : packLottery.length;
            if (packLottery.length < element.Amount) {
              errorOrderList.push({
                Number: element.Number_lottery,
                Amount: element.Amount,
                Stock: packLottery.length,
                Storename: storeName,
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
                  packLottery[i].Number_lottery,
                  packLottery[i].Lot,
                  packLottery[i].Draw,
                ]
              );
              lotteryOrderList.push(packLottery[i]);
            }
          } else {
            errorOrderList.push({
              Number: element.Number_lottery,
              Amount: element.Amount,
              Stock: packLottery.length,
              Storename: storeName,
              SID: element.SID,
              Status: "Changed Amount",
            });
            updateOutOfStock(element.Number_lottery, element.SID, element.CID);
          }
        } else {
          console.log("single");
          const [singleLottery] = await promiseLottery.execute(
            "SELECT * FROM singlelottery WHERE status='Available' and Number=?",
            [element.Number_lottery]
          );
          console.log("singleLottery", singleLottery);
          if (singleLottery.length > 0) {
            let orderSize =
              singleLottery.length >= element.Amount
                ? element.Amount
                : singleLottery.length;
            if (singleLottery.length < element.Amount) {
              errorOrderList.push({
                Number: element.Number_lottery,
                Amount: element.Amount,
                Stock: singleLottery.length,
                Storename: storeName,
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
              Number: element.Number_lottery,
              Amount: element.Amount,
              Stock: singleLottery.length,
              Storename: storeName,
              SID: element.SID,
              Status: "Changed Amount",
            });
            updateOutOfStock(element.Number_lottery, element.SID, element.CID);
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
        "UPDATE order_c SET Status='Pending Payment' WHERE OID=?",
        [OID]
      );
      res.json({
        status: "200OK",
        message: "You can payment.",
        orderID: OID,
      });
    } else {
      await promiseOrder.execute(
        "UPDATE order_c SET Status='Pending Review' WHERE OID=?",
        [OID]
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
