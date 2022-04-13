const express = require("express");
const {
    getSellerIdentity,
    updateStatusSeller
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);
router.put("/updateSellerIdentity",updateStatusSeller);

module.exports = {
  routes: router,
};
