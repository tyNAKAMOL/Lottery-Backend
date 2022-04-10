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

const validateMethod = (vd) => {
  let errMsg = "";
  for (const [key, value] of Object.entries(vd)) {
    if (value == null || value == "" || value == []) {
      errMsg += key;
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
    const errMsg = validateMethod(validateData);
    if (errMsg.length > 0) {
      res.json({
        status: "403MP",
        message: "Missing or Invalid Parameter : " + Msg,
      });
      return;
    } else {
      const decoded = jwt.verify(req.body.token, secret);
      const { username, role } = decoded;
      if (role == "seller") {
        connectionCustomer.execute(
          "SELECT SID,Status FROM seller_account WHERE Username=? ",
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

const get_lottery = (req, res) => {
  const Lottery = [];
  try {
    const decoded = jwt.verify(req.params.token, secret);
    const { username, role } = decoded;
    // const K = await getSellerID(username)
    if (role == "seller") {
      connectionCustomer.execute(
        "SELECT SID FROM seller_account WHERE Username=?",
        [username],
        function (error, sellerID) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            console.log("SID->", sellerID[0].SID);
            connectionLottery.execute(
              "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename,y.SID, count(x.Number) AS Stock FROM lottery.singlelottery x JOIN customer.seller_account y on x.SID=y.SID and y.SID=" +
                sellerID[0].SID +
                " WHERE x.Status='Available' Group By x.Number, x.Draw, y.Storename",
              function (error, S_lottery) {
                console.log(S_lottery);
                if (error) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                  return;
                } else {
                  if (S_lottery.length > 0) {
                    for (let i = 0; i < S_lottery.length; i++) {
                      S_lottery[i]["pack"] = "N";
                      Lottery.push(S_lottery[i]);
                    }
                  }
                  connectionLottery.execute(
                    "SELECT x.Number, x.Draw,x.Amount,x.Status,x.DrawDate, y.Storename,y.SID, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID and y.SID=" +
                      sellerID[0].SID +
                      " WHERE x.Status='Available' Group By x.Number, x.Draw, x.Amount, y.Storename",
                    function (error, P_lottery) {
                      console.log(P_lottery);
                      if (error) {
                        res.json({
                          status: "500IS",
                          message: "Internal Server : " + error,
                        });
                        return;
                      } else {
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

const get_singleLottery = (req, res) => {
  try {
    connectionLottery.execute(
      "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename, count(x.Number) AS Stock FROM lottery.singlelottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Status='Available' Group By x.Number, x.Draw, y.Storename",
      function (error, S_lottery) {
        console.log(S_lottery);
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          return;
        } else {
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
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const get_packLottery = (req, res) => {
  try {
    connectionLottery.execute(
      "SELECT x.Number, x.Draw,x.Amount,x.Status,x.DrawDate, y.Storename, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Status='Available' Group By x.Number, x.Draw, x.Amount, y.Storename",
      function (error, P_lottery) {
        console.log(P_lottery);
        if (error) {
          res.json({
            status: "500IS",
            message: "Internal Server : " + error,
          });
          return;
        } else {
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
        }
      }
    );
  } catch (error) {
    res.json({ status: "500IS", message: "Internal Server : " + error });
  }
};

const search_Lottery = (req, res) => {
  try {
    let lotterySearch = "";
    let Lottery = [];
    if (req.body.SearchNumber != null) {
      for (let i = 0; i < req.body.SearchNumber.length; i++) {
        req.body.SearchNumber[i] == "x"
          ? (lotterySearch += "_")
          : (lotterySearch += req.body.SearchNumber[i]);
      }

      console.log(lotterySearch);
      connectionLottery.execute(
        "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename, count(x.Number) AS Stock FROM lottery.singlelottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Number LIKE '%" +
          lotterySearch +
          "%' and x.Status='Available' Group By x.Number, x.Draw, y.Storename",
        function (error, S_lottery) {
          if (error) {
            res.json({
              status: "500IS",
              message: "Internal Server : " + error,
            });
            return;
          } else {
            if (S_lottery.length > 0) {
              for (let i = 0; i < S_lottery.length; i++) {
                S_lottery[i]["pack"] = "N";
                Lottery.push(S_lottery[i]);
              }
            }
            connectionLottery.execute(
              "SELECT x.Number, x.Draw, x.DrawDate,x.Status,y.Storename, count(x.Number) AS Stock FROM lottery.packlottery  x JOIN customer.seller_account y on x.SID=y.SID WHERE x.Number LIKE '%" +
                lotterySearch +
                "%' and x.Status='Available' Group By x.Number, x.Draw, y.Storename",
              function (error, P_lottery) {
                if (error) {
                  res.json({
                    status: "500IS",
                    message: "Internal Server : " + error,
                  });
                  return;
                } else {
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
            );
          }
        }
      );
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
  let AddLottery = true;
  await req.body.lotteryList.forEach(async (element) => {
    if(element.Number != null && element.Lot != null && element.Draw != null && element.DrawDate != null){
      await connectionLottery.execute(
        "INSERT INTO singlelottery (Number,Lot,Draw,SID,Date,DrawDate,Status) VALUES (?,?,?,?,?,?,?)",
        [
          element.Number,
          element.Lot,
          element.Draw,
          results[0].SID,
          moment(new Date()).format("YYYYMMDDHHmmssZZ"),
          element.DrawDate,
          "Available",
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
    }else{

    }
    
    console.log("in loop");
  });
  console.log("in function", AddLottery);
  return AddLottery;
};

const countAddPackLottery = async (req, res, results) => {
  let AddLottery = true;
  await req.body.lotteryList.forEach(async (element) => {
    await connectionLottery.execute(
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
