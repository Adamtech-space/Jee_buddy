const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const subscriptionRoute = require('./subscription.route');
const booksRoute = require('./books.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/subscription',
    route: subscriptionRoute,
  },
  {
    path: '/books',
    route: booksRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
