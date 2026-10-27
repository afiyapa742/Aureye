const Category = require("../models/category");
const pagination = require("../utils/pagination")

const Addcategory = async (categorydata) => {

  return await Category.create(categorydata);

};
const findCategoryByName = async (categoryName) => {
  return await Category.findOne({
    categoryName: {
      $regex: `^${categoryName}$`,
      $options: "i"
    }
  });
};


const updatestatus = async (id, updatedata) => {

  return await Category.findByIdAndUpdate(
    id,
    updatedata,
    {
      returnDocument: "after",
      runValidators: true
    }
  );

};


const getcategory = async () => {

  return await Category.find({ status: "Active"});

};


const editcategory = async (id, updatedata) => {

  return await Category.findByIdAndUpdate(
    id,
    updatedata,
    {
      returnDocument: "after"
    }
  );

};


const deletecategory = async (id) => {

  return await Category.findByIdAndDelete(id);

};


const getcategorybyid = async (id) => {

  return await Category.findById(id);

};


/* SEARCH CATEGORY */

const searchcategory = async (search) => {

  return await Category.find({

    categoryName: {

      $regex: search,

      $options: "i"

    }

  });

};

const getCategori = async (page, limit) => {

  const { skip } = pagination(page, limit);

  const categories = await Category.find()
    .skip(skip)
    .limit(limit);

  const totalCategories = await Category.countDocuments();

  return {
    categories,
    totalCategories
  };
};


const filtercategory = async (sort) => {

  return await Category.find().sort({
    categoryName: Number(sort)
  });

};
module.exports = {

  Addcategory,
  updatestatus,
  getcategory,
  editcategory,
  deletecategory,
  getcategorybyid,
  searchcategory,
   getCategori,
   filtercategory,
   findCategoryByName

};