const express = require("express");
const {
  getSellerIdentity,
  updateStatusSeller,
  getOrderPayment,
  updateOrderPayment,
  getCommon,
  updateTracking
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);
router.get("/getOrderPayment/:token", getOrderPayment);
router.get("/getCommon/:token", getCommon);
router.put("/updateSellerIdentity", updateStatusSeller);
router.put("/updateOrderPayment", updateOrderPayment);
router.put("/updateTracking", updateTracking);

module.exports = {
  routes: router,
};
