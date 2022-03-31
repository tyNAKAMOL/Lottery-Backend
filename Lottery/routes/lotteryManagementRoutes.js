const express = require("express");
const {
  add_singleLottery,
} = require("../controller/lotteryManagementController");

const router = express.Router();

router.post("/addSingleLottery", add_singleLottery);

module.exports = {
  routes: router,
};
