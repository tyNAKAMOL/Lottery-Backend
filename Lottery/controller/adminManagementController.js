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
const promiseAdmin = connectionAdmin.promise();

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

const updateStatusSeller = async (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
      approve: req.body.approve, // send "Yes" or "No"
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
      const [adminID] = await promiseAdmin.execute(
        "SELECT AID FROM account WHERE Username=?",
        [username]
      );
      if (adminID != undefined) {
        if (role == "admin") {
          if (req.body.approve == "Yes") {
            await promiseCustomer.execute(
              "UPDATE seller_account SET Status=? WHERE SID=? and Status='sellerIdentity'",
              ["registered", req.body.sellerID]
            );
            await sendInbox({
              Subject: "บัญชีของคุณได้รับการยืนยันตัวตน",
              Detail:
                "ทางเราได้ทำการตรวจสอบการยืนยันตัวจนบัญชีของคุณ" +
                (await getName(req.body.sellerID)) +
                "เรียบร้อยแล้ว บัญชีของคุณได้รับการอนุมัติสามารถวางจำหน่ายสินค้าได้ ขอขอบคุณ",
              Date: moment(new Date()).format("YYYYMMDDHHmmssZZ"),
              CID: "",
              SID: req.body.sellerID,
              AID: adminID[0].AID,
            });
            await addTransactionAdmin({
              Event:
                "Approved SellerAccount [ " +
                (await getName(req.body.sellerID)) +
                " sellerID : " +
                req.body.sellerID +
                "]",
              actionDate: moment(new Date()).format("YYYYMMDDHHmmssZZ"),
              AID: adminID[0].AID,
            });
          
          } else {
            await sendInbox({
              Subject: "บัญชีของคุณไม่ได้รับการยืนยันตัวตน",
              Detail:
                "ทางเราได้ทำการตรวจสอบการยืนยันตัวจนบัญชีของคุณ" +
                (await getName(req.body.sellerID)) +
                "เรียบร้อยแล้ว ไม่สามารถอนุมัติให้ใช้งานได้เนื่องจากรูปถ่ายของคุณมีความไม่ชัดเจน/ไม่ถูกต้อง/ไม่สามารถระบุตัวตนได้ กรุณาส่งรูปถ่ายยืนยันตัวตนอีกครั้ง หากมีข้อสงสัยติดต่อที่ admin ขอขอบคุณ",
              Date: moment(new Date()).format("YYYYMMDDHHmmssZZ"),
              CID: "",
              SID: req.body.sellerID,
              AID: adminID[0].AID,
            });
            await addTransactionAdmin({
              Event:
                "Reject SellerAccount [ " +
                (await getName(req.body.sellerID)) +
                " sellerID : " +
                req.body.sellerID +
                "]" + " Because Image cannot Identity.",
              actionDate: moment(new Date()).format("YYYYMMDDHHmmssZZ"),
              AID: adminID[0].AID,
            });
          }
          res.json({
            status: "200OK",
            message: "Success",
          });
        }
      }
    }
  } catch (error) {
    res.json({
      status: "500IS",
      message: "Internal Server : " + error,
    });
  }
};
const sendInbox = async (params) => {
  await promiseAdmin.execute(
    "INSERT INTO inbox (Subject,Detail,Date,CID,SID,AID) VALUES (?,?,?,?,?,?)",
    [
      params.Subject,
      params.Detail,
      params.Date,
      params.CID,
      params.SID,
      params.AID,
    ]
  );
};
const addTransactionAdmin = async (params) => {
  await promiseAdmin.execute(
    "INSERT INTO transaction (Event,actionDate,AID) VALUES (?,?,?)",
    [params.Event, params.actionDate, params.AID]
  );
};

const getName = async (SID) => {
  const [FullName] = await promiseCustomer.execute(
    "SELECT Firstname,Lastname FROM seller_account WHERE SID=?",
    [SID]
  );
  let fullName = FullName[0].Firstname + " " + FullName[0].Lastname;
  return fullName;
};

module.exports = {
  getSellerIdentity,
  updateStatusSeller,
};
