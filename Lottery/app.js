var express = require("express");
const router = express.Router();
var cors = require("cors");
var bodyParser = require("body-parser");

//new line by M
const userManagementRoutes = require("./routes/userManagementRoutes");
const orderManagementRoutes = require("./routes/orderManagementRoutes");
const lotteryManagementRoutes = require("./routes/lotteryManagementRoutes");
const adminManagementRoutes = require("./routes/adminManagementRoutes");

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(userManagementRoutes.routes);
app.use(orderManagementRoutes.routes);
app.use(lotteryManagementRoutes.routes);
app.use(adminManagementRoutes.routes);

app.use(router).listen(3333, function () {
  console.log("Server Started...");
});
