const express = require("express");
const {
    getSellerIdentity,
    updateStatusSeller,
    getOrderPayment,
    updateOrderPayment
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);
router.get("/getOrderPayment/:token", getOrderPayment);
router.put("/updateSellerIdentity",updateStatusSeller);
router.put("/updateOrderPayment",updateOrderPayment);

module.exports = {
  routes: router,
};
