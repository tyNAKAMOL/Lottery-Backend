var jwt = require("jsonwebtoken");
const secret = "Login";

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
    let errorAddLottery = false;
    // const x = await checkErrorAddLottery(req, res, countAddLottery);
    var countAddLottery = 0;
    if (role == "seller") {
      connectionCustomer.execute(
        "SELECT SID FROM seller_account WHERE Username=? ",
        [username],
        function (error, results) {
          if (error) {
            console.log("error SID");
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            req.body.lotteryList.forEach(async (element) => {
              connectionLottery.execute(
                "INSERT INTO singlelottery (Number,Lot,Draw,SID) VALUES (?,?,?,?)",
                [element.Number, element.Lot, element.Draw, results[0].SID],
                function (error) {
                  if (error) {
                    ERROR = true;
                    console.log("error add single lottery");
                    res.json({
                      status: "500IS",
                      message: "Internal Server : " + error,
                    });
                    return;
                  } else {
                    countAddLottery = countAddLottery + 1;
                    console.log("in loop", countAddLottery);
                  }
                }
              );
              errorAddLottery = await checkErrorAddLottery(req, res, countAddLottery);
            });
            console.log(req.body.lotteryList.length);
            console.log(countAddLottery);
            if (errorAddLottery) {
              res.json({
                status: "500IS",
                message: "Internal Server : " + "error add single lottery",
              });
            } else {
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

module.exports = {
  add_singleLottery,
};

const checkErrorAddLottery = async (req, res, countAddLottery) => {
  try {
    let ERROR = false;
    if (req.body.lotteryList.length != countAddLottery) {
      ERROR = true;
    }
    return ERROR;
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};
