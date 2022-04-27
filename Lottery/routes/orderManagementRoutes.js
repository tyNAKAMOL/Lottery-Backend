const express = require("express");
const {
    add_cart,
    get_cart,
    update_cart,
    delete_cart ,
    confirmed_order,
    update_URLSlip,
    getSellerCheckOrder,
    updateSellerCheckOrder,
    randomLottery,
    updatePendingReview,
    getTransaction
} = require("../controller/orderManagementController");

const router = express.Router();

router.post("/cart", add_cart);
router.post("/confirmedOrder", confirmed_order);
router.get("/getCart/:token", get_cart);
router.get("/getTransaction/:token", getTransaction);
router.get("/getSellerCheckOrder/:token", getSellerCheckOrder);
router.put("/updateOrderSlip/", update_URLSlip);
// router.put("/updateCart/", update_cart);
router.post("/randomLottery", randomLottery);
router.delete("/removeLottery/", delete_cart);
router.put("/updateSellerCheckOrder", updateSellerCheckOrder);
router.put("/updatePendingReview", updatePendingReview);

module.exports = {
  routes: router,
};
