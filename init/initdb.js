const mongoose = require("mongoose");
const blogData = require("./blogData");
const Project = require("../model/project");
const Blog = require("../model/blog");
const publicationDemoData = require("./publicationData");
const Publication = require("../model/publication");

async function initDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/Rasel_hasan");
    console.log("Connected to MongoDB");

    await Blog.deleteMany({});
    const insertedBlogs = await Blog.insertMany(blogData);
    console.log(`Inserted ${insertedBlogs.length} Blog`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

async function initPublicationDemoData() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/Rasel_hasan");
    console.log("connection Successfull");

    await Publication.deleteMany({});
    await Publication.insertMany(publicationDemoData);
    console.log("data successfully inserted");
  } catch (err) {
    console.log(err.message);
  } finally {
    await mongoose.disconnect();
    console.log("DB discnnected");
  }
}

initPublicationDemoData();
