const express = require("express");
const {
    getSellerIdentity,
    updateStatusSeller,
    getOrderPayment
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);
router.get("/getOrderPayment/:token", getOrderPayment);
router.put("/updateSellerIdentity",updateStatusSeller);

module.exports = {
  routes: router,
};
