const express = require("express");
const router = express.Router();
const UserRoute = require("./user.route");

const Routes = [
  {
    path: "/user",
    route: UserRoute,
  },
];

Routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
