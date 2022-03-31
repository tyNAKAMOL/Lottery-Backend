var express = require("express");
const router = express.Router();
var cors = require("cors");
var bodyParser = require("body-parser");

//new line by M
const userManagementRoutes = require("./routes/userManagementRoutes");
const orderManagementRoutes = require("./routes/orderManagementRoutes");
const lotteryManagementRoutes = require("./routes/lotteryManagementRoutes");

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(userManagementRoutes.routes);
app.use(orderManagementRoutes.routes);
app.use(lotteryManagementRoutes.routes);

app.use(router).listen(3333, function () {
  console.log("Server Started...");
});
