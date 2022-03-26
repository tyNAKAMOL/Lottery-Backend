const express = require("express");
const {
    add_cart,
    get_cart 
} = require("../controller/orderManagementController");

const router = express.Router();

router.post("/cart", add_cart);
router.get("/getCart/:token", get_cart);

module.exports = {
  routes: router,
};