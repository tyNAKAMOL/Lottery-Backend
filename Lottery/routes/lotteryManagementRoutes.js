const express = require("express");
const {
  add_singleLottery,
  add_packLottery,
  get_singleLottery,
  get_packLottery,
  get_lottery,
  search_Lottery,
} = require("../controller/lotteryManagementController");

const router = express.Router();

router.post("/addSingleLottery", add_singleLottery);
router.post("/addPackLottery", add_packLottery);
router.get("/getSingleLottery", get_singleLottery);
router.get("/getPackLottery", get_packLottery);
router.get("/getLottery/:token", get_lottery);
router.post("/getSearch", search_Lottery);

module.exports = {
  routes: router,
};
