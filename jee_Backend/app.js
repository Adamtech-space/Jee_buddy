const express = require("express");
const cors = require("cors");
const routes = require("./src/routes/v1");
const httpStatus = require("http-status");
const { errorConverter, errorHandler } = require("./src/middlewares/errors");
const ApiError = require("./src/utils/ApiError");

const app = express();

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());

// root route to show server status
app.get("/", (req, res) => {
  res.json("JEE Buddy Backend Server is running");
});

// v1 api routes
app.use("/v1", routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
