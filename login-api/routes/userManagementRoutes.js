const express = require("express");
const {
  login,
  register,
  logout,
  sellerUpdateAccount,
  getSellerAccount,
  getBankSeller,
  getCustomerAccount,
  customerUpdateAccount,
} = require("../controller/userManagementController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/getSellerAccount/:token", getSellerAccount);
router.get("/getSellerBank/:token", getBankSeller);
router.get("/getCustomerAccount/:token", getCustomerAccount);
router.put("/updateSellerAccount/seller/:action", sellerUpdateAccount);
router.put("/updateCustomerAccount/customer/:action", customerUpdateAccount);

module.exports = {
  routes: router,
};
