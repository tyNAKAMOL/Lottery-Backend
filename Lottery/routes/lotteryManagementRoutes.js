const express = require("express");
const {
  add_singleLottery,
  add_packLottery,
  get_singleLottery,
  get_packLottery,
} = require("../controller/lotteryManagementController");

const router = express.Router();

router.post("/addSingleLottery", add_singleLottery);
router.post("/addPackLottery", add_packLottery);
router.get("/getSingleLottery", get_singleLottery);
router.get("/getPackLottery", get_packLottery);

module.exports = {
  routes: router,
};
