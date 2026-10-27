const {
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
} = require("../repositories/Admincategory");


const getcatgry = async () => {

  const categories = await getcategory();

  if (!categories) {
    throw new Error("Something went wrong");
  }

  return categories;
};
const FindcategorybyName = async (categoryName) => {

  const category = await findCategoryByName(categoryName);

  if (category) {
    throw new Error("Category already exists");
  }

  return null;
};
const addcategory = async (categorydata) => {

  await FindcategorybyName(categorydata.categoryName);

  const category = await Addcategory(categorydata);

  if (!category) {
    throw new Error("something went wrong");
  }

  return category;
};


const updatecategory = async (id, updatedata) => {

  const update = await updatestatus(
    id,
    updatedata
  );

  if (!update) {
    throw new Error("The category update failed");
  }

  return update;
};


const editCategory = async (id, updatedata) => {

  const category = await editcategory(
    id,
    updatedata
  );

  if (!category) {
    throw new Error("somethingwent wrong");
  }

  return category;
};


const deleteCategory = async (id) => {

  const category = await deletecategory(id);

  if (!category) {
    throw new Error("something wrong");
  }

  return category;
};


const getCategoryById = async (id) => {

  const category = await getcategorybyid(id);

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};


/* SEARCH CATEGORY */

const searchCategory = async (search) => {

  const category = await searchcategory(search);

  if (!category) {
    throw new Error("The category does not exist");
  }

  return category;
};

const getpagination = async(page,limit)=>{

  const pages = await  getCategori (page,limit);

  if(!pages){
    throw new Error("somewent wrong")
  }
  return pages
}

const filterCategory = async(sort)=>{
  const filter = await filtercategory(sort);

  if(!filter){
    throw new Error("something went wrong")
  }
  return filter
}

module.exports = {
  addcategory,
  updatecategory,
  getcatgry,
  editCategory,
  deleteCategory,
  getCategoryById,
  searchCategory,
  getpagination,
  filterCategory,

};