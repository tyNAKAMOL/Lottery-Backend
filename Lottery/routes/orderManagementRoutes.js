const express = require("express");
const {
    add_cart,
    get_cart,
    update_cart,
    delete_cart ,
    confirmed_order,
    update_URLSlip,
    getSellerCheckOrder
} = require("../controller/orderManagementController");

const router = express.Router();

router.post("/cart", add_cart);
router.post("/confirmedOrder", confirmed_order);
router.get("/getCart/:token", get_cart);
router.get("/getSellerCheckOrder/:token", getSellerCheckOrder);
router.put("/updateOrderSlip/", update_URLSlip);
// router.put("/updateCart/", update_cart);
router.delete("/removeLottery/", delete_cart);

module.exports = {
  routes: router,
};