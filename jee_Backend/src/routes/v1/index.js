const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const booksRoute = require('./books.route');
const flashcardsRoute = require('./flashcards.route');
const studyMaterialsRoute = require('./study-materials.route');

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
    path: '/books',
    route: booksRoute,
  },
  {
    path: '/flashcards',
    route: flashcardsRoute,
  },
  {
    path: '/study-materials',
    route: studyMaterialsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router; 