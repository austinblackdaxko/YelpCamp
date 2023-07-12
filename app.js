if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log(process.env.SECRET)

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require('helmet');
const MongoStore = require('connect-mongo')(session);
const dbUrl = 'mongodb://localhost:27017/yelp-camp'

// mongodb://localhost:27017/yelp-camp - local db

// List of Routes
const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

mongoose.set("strictQuery", false);
mongoose.connect(dbUrl, {});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const store = new MongoStore({
  url: dbUrl,
  secret: 'thisshouldbeabettersecret',
  touchAfter: 24 * 3600
});

store.on("error", function(e) {
  console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
  store,
  name: 'blah',
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 604800000,
    maxAge: 604800000,
  },
};
app.use(session(sessionConfig));
app.use(flash());
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net/",
  "https://res.cloudinary.com/dfypl6bh3/"
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net/",
  "https://res.cloudinary.com/dfypl6bh3/"
];
const connectSrcUrls = [
  "https://*.tiles.mapbox.com",
  "https://api.mapbox.com",
  "https://events.mapbox.com",
  "https://res.cloudinary.com/dfypl6bh3/"
];
const fontSrcUrls = [ "https://res.cloudinary.com/dfypl6bh3/" ];

app.use(
  helmet({
      contentSecurityPolicy: {
          directives : {
              defaultSrc : [],
              connectSrc : [ "'self'", ...connectSrcUrls ],
              scriptSrc  : [ "'unsafe-inline'", "'self'", ...scriptSrcUrls ],
              styleSrc   : [ "'self'", "'unsafe-inline'", ...styleSrcUrls ],
              workerSrc  : [ "'self'", "blob:" ],
              objectSrc  : [],
              imgSrc     : [
                  "'self'",
                  "blob:",
                  "data:",
                  "https://res.cloudinary.com/dfypl6bh3/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                  "https://images.unsplash.com/"
              ],
              fontSrc    : [ "'self'", ...fontSrcUrls ],
              mediaSrc   : [ "https://res.cloudinary.com/dfypl6bh3/" ],
              childSrc   : [ "blob:" ]
          }
      },
      crossOriginEmbedderPolicy: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/fakeUser", async (req, res) => {
  const user = new User({ email: "austin@daxkooooo.com", username: "dab" });
  const newUser = await User.register(user, "crazytrain");
  res.send(newUser)
});

app.use('/', userRoutes)
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("errors", { err });
});

app.listen(3000, () => {
  console.log("Serving on Port 3000");
});
