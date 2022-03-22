const express = require("express");
const {
  login,
  register,
  logout,
  sellerUpdateAccount,
  getSellerAccount,
  getBankSeller
} = require("../controller/userManagementController");

const router = express.Router();

router.get("/getCustomerAccount/:token",getSellerAccount)
router.get("/getSellerBank/:token",getBankSeller);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.put("/updateAccount/seller/:action",sellerUpdateAccount);

module.exports = {
  routes: router,
};
