const express = require("express");
const {
    add_cart,
    get_cart,
    update_cart,
    delete_cart ,
    confirmed_order
} = require("../controller/orderManagementController");

const router = express.Router();

router.post("/cart", add_cart);
router.post("/confirmedOrder", confirmed_order);
router.get("/getCart/:token", get_cart);
// router.put("/updateCart/", update_cart);
router.delete("/removeLottery/", delete_cart);

module.exports = {
  routes: router,
};