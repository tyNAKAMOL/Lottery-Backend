const express = require("express");
const {
  getSellerIdentity,
  updateStatusSeller,
  getOrderPayment,
  updateOrderPayment,
  getCommon,
  updateTracking,
  getNotification 
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);
router.get("/getOrderPayment/:token", getOrderPayment);
router.get("/getNotification/:token",  getNotification );
router.get("/getCommon/:token", getCommon);
router.put("/updateSellerIdentity", updateStatusSeller);
router.put("/updateOrderPayment", updateOrderPayment);
router.put("/updateTracking", updateTracking);

module.exports = {
  routes: router,
};
