var jwt = require("jsonwebtoken");
const secret = "Login";
var moment = require("moment");

const mysql = require("mysql2");

const connectionLottery = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "lottery",
});
const promiseLottery = connectionLottery.promise();

const connectionCustomer = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "customer",
});
const promiseCustomer = connectionCustomer.promise();

const validateMethod = (vd) => {
  let errMsg = "";
  for (const [key, value] of Object.entries(vd)) {
    if (value == null || value == "" || value == []) {
      errMsg += key+" ";
    }
  }
  return errMsg;
};
const validateMethodLottery = (vd,Pack) => {
  let errMsg = "";
  for (const [key, value] of Object.entries(vd)) {
    if (value == null || value == "" || value == []) {
      errMsg += key+" ";
    }
    if(key=="lotteryList"){
      for(const vdLottery of vd.lotteryList){
        let params = {
          Number: vdLottery.Number,
          Lot: vdLottery.Lot,
          Draw: vdLottery.Draw,
          DrawDate: vdLottery.DrawDate
        }
        if(Pack == "Y"){
          params["Amount"] = vdLottery.Amount
        }
        for(const [key,value] of Object.entries(params)){
          if (value == null || value == "" ){
            errMsg += key+" ";
          }
        }
      }
      
    }
  }
  return errMsg;
};

const add_singleLottery = async (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
      lotteryList: req.body.lotteryList,
    };
    const errMsg = validateMethodLottery(validateData,"N");
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
      return;
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "seller") {
        const [results] = await promiseCustomer.execute(
          "SELECT SID,Status FROM seller_account WHERE Username=? ",
          [username]
        );
        const countAddLottery = await countAddSingleLottery(req, res, results);
        if (countAddLottery == true) {
          res.json({
            status: "200OK",
            message: "Add single lottery to store success!!",
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

const add_packLottery = async (req, res) => {
  try {
    let validateData = {
      token: req.body.token,
      lotteryList: req.body.lotteryList,
    };
    const errMsg = validateMethodLottery(validateData,"Y");
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "seller") {
        const [sellerID] = await promiseCustomer.execute(
          "SELECT SID FROM seller_account WHERE Username=? ",
          [username]
        );
        const countAddLottery = await countAddPackLottery(req, res, sellerID);
        if (countAddLottery == true) {
          res.json({
            status: "200OK",
            message: "Add pack lottery to store success!!",
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

const get_lottery = async (req, res) => {
  const Lottery = [];
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
    } else {
      const decoded = jwt.verify(req.params.token, secret);
      const { username, role } = decoded;
      // const K = await getSellerID(username)
      if (role == "seller") {
        const [sellerID] = await promiseCustomer.execute(
          "SELECT SID FROM seller_account WHERE Username=?",
          [username]
        );
        console.log("SID->", sellerID[0].SID);
        const [S_lottery] = await promiseLottery.execute(
          "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename,y.SID, count(x.Number) AS Stock FROM lottery.singlelottery x JOIN customer.seller_account y on x.SID=y.SID and y.SID=" +
            sellerID[0].SID +
            " WHERE x.Status='Available' Group By x.Number, x.Draw, y.Storename"
        );
        if (S_lottery.length > 0) {
          for (let i = 0; i < S_lottery.length; i++) {
            S_lottery[i]["pack"] = "N";
            Lottery.push(S_lottery[i]);
          }
        }
        const [P_lottery] = await promiseLottery.execute(
          "SELECT x.Number, x.Draw,x.Amount,x.Status,x.DrawDate, y.Storename,y.SID, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID and y.SID=" +
            sellerID[0].SID +
            " WHERE x.Status='Available' Group By x.Number, x.Draw, x.Amount, y.Storename"
        );
        if (P_lottery.length > 0) {
          for (let i = 0; i < P_lottery.length; i++) {
            P_lottery[i]["pack"] = "Y";
            Lottery.push(P_lottery[i]);
          }
        }
        res.json({
          status: "200OK",
          message: "get lottery success",
          lottery: Lottery,
        });
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

const get_singleLottery = async (req, res) => {
  try {
    const [S_lottery] = await promiseLottery.execute(
      "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename, count(x.Number) AS Stock FROM lottery.singlelottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Status='Available' Group By x.Number, x.Draw, y.Storename"
    );
    if (S_lottery.length > 0) {
      for (let i = 0; i < S_lottery.length; i++) {
        S_lottery[i]["pack"] = "N";
      }
    }
    res.json({
      status: "200OK",
      message: "get single lottery success",
      single_lottery: S_lottery,
    });
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const get_packLottery = async (req, res) => {
  try {
    const [P_lottery] = await promiseLottery.execute(
      "SELECT x.Number, x.Draw,x.Amount,x.Status,x.DrawDate, y.Storename, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Status='Available' Group By x.Number, x.Draw, x.Amount, y.Storename"
    );
    if (P_lottery.length > 0) {
      for (let i = 0; i < P_lottery.length; i++) {
        P_lottery[i]["pack"] = "Y";
      }
    }
    res.json({
      status: "200OK",
      message: "get pack lottery success",
      pack_lottery: P_lottery,
    });
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const search_Lottery = async (req, res) => {
  try {
    let validateData = {
      SearchNumber: req.body.SearchNumber,
      // lotteryList: req.body.lotteryList,
    };
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + errMsg,
      });
    } else {
      let lotterySearch = "";
      let Lottery = [];
      if (req.body.SearchNumber != null) {
        for (let i = 0; i < req.body.SearchNumber.length; i++) {
          req.body.SearchNumber[i] == "x"
            ? (lotterySearch += "_")
            : (lotterySearch += req.body.SearchNumber[i]);
        }

        console.log(lotterySearch);
        const [S_lottery] = await promiseLottery.execute(
          "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename, count(x.Number) AS Stock FROM lottery.singlelottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Number LIKE '%" +
            lotterySearch +
            "%' and x.Status='Available' Group By x.Number, x.Draw, y.Storename"
        );
        if (S_lottery.length > 0) {
          for (let i = 0; i < S_lottery.length; i++) {
            S_lottery[i]["pack"] = "N";
            Lottery.push(S_lottery[i]);
          }
        }
        const [P_lottery] = await promiseLottery.execute(
          "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Number LIKE '%" +
            lotterySearch +
            "%' and x.Status='Available' Group By x.Number, x.Draw, y.Storename"
        );
        if (P_lottery.length > 0) {
          for (let i = 0; i < P_lottery.length; i++) {
            P_lottery[i]["pack"] = "Y";
            Lottery.push(P_lottery[i]);
          }
        }
        console.log(Lottery);
        res.json({
          status: "200OK",
          message: "get search lottery success!!",
          search_lottery: Lottery,
        });
      }
    }
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

module.exports = {
  add_singleLottery,
  add_packLottery,
  get_singleLottery,
  get_packLottery,
  get_lottery,
  search_Lottery,
};

const countAddSingleLottery = async (req, res, results) => {
  let errInLotteryList = [];
  let AddLottery = true;
  let validateData = {
    lotteryList: req.body.lotteryList,
  };
  const errMsg = validateMethodLottery(validateData,"N");
  if (errMsg.length > 0) {
    res.json({
      status: "403MP",
      message: "Missing or Invalid Parameter : " + errMsg,
    });
    return (AddLottery = false);
  } else {
    for (const element of req.body.lotteryList) {
      if (
        element.Number == "" ||
        element.Lot == "" ||
        element.Draw == "" ||
        element.DrawDate == ""
      ) {
        errInLotteryList.push(element);
        // console.log(element)
      }
    }
    if (errInLotteryList.length > 0) {
      // console.log(errInLotteryList)
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter",
        errorList: errInLotteryList,
      });
      return (AddLottery = false);
    } else {
      for (const element of req.body.lotteryList) {
        console.log(element);
        await promiseLottery.execute(
          "INSERT INTO singlelottery (Number,Lot,Draw,SID,Date,DrawDate,Status) VALUES (?,?,?,?,?,?,?)",
          [
            element.Number,
            element.Lot,
            element.Draw,
            results[0].SID,
            moment(new Date()).format("YYYYMMDDHHmmssZZ"),
            element.DrawDate,
            "Available",
          ]
        );
      }
    }
  }
  console.log("in function", AddLottery);
  return AddLottery;
};

const countAddPackLottery = async (req, res, results) => {
  let errInLotteryList = [];
  let AddLottery = true;
  let validateData = {
    lotteryList: req.body.lotteryList,
  };
  const errMsg = validateMethodLottery(validateData,"Y");
  if (errMsg.length > 0) {
    res.json({
      status: "403MP",
      message: "Missing or Invalid Parameter : " + errMsg,
    });
    return (AddLottery = false);
  } else {
    for (const element of req.body.lotteryList) {
      if (
        element.Number == "" ||
        element.Amount == "" ||
        element.Lot == "" ||
        element.Draw == "" ||
        element.DrawDate == ""
      ) {
        errInLotteryList.push(element);
      }
    }
    if (errInLotteryList.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter",
        errorList: errInLotteryList,
      });
      return (AddLottery = false);
    } else {
      for (const element of req.body.lotteryList) {
        await promiseLottery.execute(
          "INSERT INTO packlottery (Number,Lot,Draw,SID,Date,Amount,DrawDate,Status) VALUES (?,?,?,?,?,?,?,?)",
          [
            element.Number,
            element.Lot,
            element.Draw,
            results[0].SID,
            moment(new Date()).format("YYYYMMDDHHmmssZZ"),
            element.Amount,
            element.DrawDate,
            "Available",
          ]
        );
      }
    }
  }
  console.log("in function", AddLottery);
  return AddLottery;
};
