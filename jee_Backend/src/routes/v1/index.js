const express = require("express");
const router = express.Router();
const authRoute = require("./auth.route");
const userRoute = require("./user.route");

const Routes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
];

Routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router; 