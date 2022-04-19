const express = require("express");
const {
  getSellerIdentity,
  updateStatusSeller,
  getOrderPayment,
  updateOrderPayment,
  getCommon,
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);
router.get("/getOrderPayment/:token", getOrderPayment);
router.get("/getCommon", getCommon);
router.put("/updateSellerIdentity", updateStatusSeller);
router.put("/updateOrderPayment", updateOrderPayment);

module.exports = {
  routes: router,
};
