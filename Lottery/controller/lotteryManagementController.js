var jwt = require("jsonwebtoken");
const secret = "Login";
var moment = require("moment");

const mysql = require("mysql2");
const connectionLottery = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "lottery",
});
const connectionCustomer = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "customer",
});

const add_singleLottery = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "seller") {
      connectionCustomer.execute(
        "SELECT SID FROM seller_account WHERE Username=? ",
        [username],
        async function (error, results) {
          if (error) {
            console.log("error SID");
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            const countAddLottery = await countAddSingleLottery(
              req,
              res,
              results
            );
            if (countAddLottery == true) {
              res.json({
                status: "200OK",
                message: "Add single lottery to store success!!",
              });
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
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const add_packLottery = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, secret);
    const { username, role } = decoded;
    if (role == "seller") {
      connectionCustomer.execute(
        "SELECT SID FROM seller_account WHERE Username=? ",
        [username],
        async function (error, results) {
          if (error) {
            console.log("error SID");
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            const countAddLottery = await countAddPackLottery(
              req,
              res,
              results
            );
            if (countAddLottery == true) {
              res.json({
                status: "200OK",
                message: "Add pack lottery to store success!!",
              });
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
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const get_singleLottery = (req,res) => {
  try {
    connectionLottery.execute(
      "SELECT x.Number, x.Draw, x.DrawDate,y.Storename, count(x.Number) AS Stock FROM lottery.singlelottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.OID='' Group By x.Number, x.Draw, y.Storename" ,
      function (error, S_lottery) {
        console.log(S_lottery);
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          return;
        } else {
          res.json({
            status: "200OK",
            message: "get single lottery success",
            single_lottery: S_lottery,
          });
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const get_packLottery = (req,res) => {
  try {
    connectionLottery.execute(
      "SELECT x.Number, x.Draw,x.Amount,x.DrawDate, y.Storename, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.OID='' Group By x.Number, x.Draw, x.Amount, y.Storename",
      function (error, P_lottery) {
        console.log(P_lottery);
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          return;
        } else {
          res.json({
            status: "200OK",
            message: "get pack lottery success",
            pack_lottery: P_lottery,
          });
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

module.exports = {
  add_singleLottery,
  add_packLottery,
  get_singleLottery,
  get_packLottery,
};

const countAddSingleLottery = async (req, res, results) => {
  let AddLottery = true;
  await req.body.lotteryList.forEach(async (element) => {
    await connectionLottery.execute(
      "INSERT INTO singlelottery (Number,Lot,Draw,SID,Date,DrawDate) VALUES (?,?,?,?,?)",
      [
        element.Number,
        element.Lot,
        element.Draw,
        results[0].SID,
        moment(new Date()).format("YYYYMMDDHHmmssZZ"),
        element.DrawDate
      ],
      async function (error) {
        if (error) {
          connectionLottery.execute(
            "DELETE FROM singlelottery WHERE SID=? and Date BETWEEN ? and ?",
            [
              results[0].SID,
              moment(new Date())
                .subtract(20, "seconds")
                .format("YYYYMMDDHHmmssZZ"),
              moment(new Date()).add(20, "seconds").format("YYYYMMDDHHmmssZZ"),
            ],
            function (error) {
              if (error) {
                console.log("error add single lottery");
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + error,
                });
                AddLottery = false;
                return AddLottery;
              }
            }
          );
          console.log("error add single lottery");
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          AddLottery = false;
          return AddLottery;
        }
      }
    );
    console.log("in loop");
  });
  console.log("in function", AddLottery);
  return AddLottery;
};

const countAddPackLottery = async (req, res, results) => {
  let AddLottery = true;
  await req.body.lotteryList.forEach(async (element) => {
    await connectionLottery.execute(
      "INSERT INTO packlottery (Number,Lot,Draw,SID,Date,Amount,DrawDate) VALUES (?,?,?,?,?,?)",
      [
        element.Number,
        element.Lot,
        element.Draw,
        results[0].SID,
        moment(new Date()).format("YYYYMMDDHHmmssZZ"),
        element.Amount,
        element.DrawDate,
      ],
      async function (error) {
        if (error) {
          connectionLottery.execute(
            "DELETE FROM packlottery WHERE SID=? and Date BETWEEN ? and ?",
            [
              results[0].SID,
              moment(new Date())
                .subtract(20, "seconds")
                .format("YYYYMMDDHHmmssZZ"),
              moment(new Date()).add(20, "seconds").format("YYYYMMDDHHmmssZZ"),
            ],
            function (error) {
              if (error) {
                console.log("error add pack lottery");
                res.json({
                  status: "500IS",
                  message: "Internal Server : " + error,
                });
                AddLottery = false;
                return AddLottery;
              }
            }
          );
          console.log("error add pack lottery");
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          AddLottery = false;
          return AddLottery;
        }
      }
    );
    console.log("in loop");
  });
  console.log("in function", AddLottery);
  return AddLottery;
};
