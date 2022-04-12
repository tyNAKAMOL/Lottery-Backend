const express = require("express");
const {
    getSellerIdentity
} = require("../controller/adminManagementController");

const router = express.Router();

router.get("/getSellerIdentity/:token", getSellerIdentity);

module.exports = {
  routes: router,
};
