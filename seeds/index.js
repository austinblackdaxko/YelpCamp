const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");

mongoose.connect("mongodb://localhost:27017/yelp-camp");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: "64a6ce583dd8f56fb114c8d8",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      geometry: {type: "Point", coordinates: [cities[random1000].longitude, cities[random1000].latitude]},
      title: `${sample(descriptors)} ${sample(places)}`,
      images: [
        {
          url: 'https://res.cloudinary.com/dfypl6bh3/image/upload/v1679536790/YelpCamp/zzemfaeulavmzxca5ttk.jpg',
          filename: 'YelpCamp/zzemfaeulavmzxca5ttk'
        }
      ],
      description: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Animi nulla quaerat repellendus, illum itaque eius et distinctio beatae molestiae nemo dolorum incidunt, numquam quia autem neque mollitia officiis harum rem.',
      price: price
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
