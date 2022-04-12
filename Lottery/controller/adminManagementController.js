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

const connectionLottery = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "lottery",
});
const promiseLottery = connectionLottery.promise();

const connectionAdmin = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "admin",
});
const promiseAdmin = connectionLottery.promise();

const validateMethod = (vd) => {
  let errMsg = "";
  for (const [key, value] of Object.entries(vd)) {
    if (value == null || value == "") {
      errMsg += key;
    }
  }
  return errMsg;
};

const getSellerIdentity = async (req, res) => {
  try {
    let sellerIdentity = [];
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
      if (role == "admin") {
        const [result] = await promiseCustomer.execute(
          "select * from seller_account where Status='sellerIdentity'"
        );
        if (result.length == 0) {
          res.json({
            status: "200NF",
            message: "not found in seller status sellerIdentity",
          });
        } else {
          for (let i = 0; i < result.length; i++) {
            sellerIdentity.push({
              SellerID: result[i].SID,
              Firstname: result[i].Firstname,
              Lastname: result[i].Lastname,
              Tel: result[i].Tel,
              Birthday: result[i].Birthday,
              Email: result[i].Email,
              Address: {
                HomeNo: result[i].HomeNo,
                Soi: result[i].Soi,
                Road: result[i].Road,
                Subdistrict: result[i].Subdistrict,
                District: result[i].District,
                Province: result[i].Province,
                ZipCode: result[i].ZipCode,
              },
              Storename: result[i].Storename,
              URLImage: result[i].URL_image_profile,
            });
          }
          res.json({
            status: "200OK",
            message: "get sellerIdentity account success!!",
            sellerAccount: sellerIdentity,
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

module.exports = {
  getSellerIdentity,
};
