const {
  addcategory,
  updatecategory,
  getcatgry,
  editCategory,
  deleteCategory,
  getCategoryById,
  searchCategory,
  getpagination,
  filterCategory,

} = require("../services/catergory");


const adcategory = async (req, res) => {
  try {

    const {
      categoryName,
      description,
      status,
      isHomeBanner
    } = req.body;

    const image = req.file ? req.file.filename : null;

    const categorydata = {
      categoryName,
      description,
      status,
      image,
      isHomeBanner: isHomeBanner === "true"
    };

    const category = await addcategory(categorydata);

    if (!category) {
      return res.status(400).json({
        message: "Category creation failed"
      });
    }

    return res.status(201).json({
      message: "Category created successfully",
      data: category
    });

  } catch (error) {

    console.error(
      "CATEGORY CREATE ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message || "Something went wrong"
    });
  }
};
const getCategory = async (req, res) => {

  try {

    const categories = await getcatgry();

    return res.status(200).json({
      data: categories
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message
    });

  }
};


const EditCategory = async (req, res) => {

  try {

    const { id } = req.params;

    const updatedata = req.body;

    if (req.file) {
      updatedata.image = req.file.filename;
    }

    const category = await editCategory(id, updatedata);

    if (!category) {
      return res.status(400).json({
        message: "Category update failed"
      });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      data: category
    });

  } catch (error) {

    return res.status(400).json({
      message: error.message
    });

  }
};


const DeleteCategory = async (req, res) => {

  try {

    const { id } = req.params;

    const category = await deleteCategory(id);

    if (category) {

      return res.status(200).json({
        message: "Successfully deleted"
      });

    }

    return res.status(404).json({
      message: "Category not found"
    });

  } catch (error) {

    return res.status(400).json({
      message: error.message
    });

  }
};


const GetCategoryById = async (req, res) => {

  try {

    const { id } = req.params;

    const category = await getCategoryById(id);

    return res.status(200).json({
      data: category
    });

  } catch (error) {

    return res.status(400).json({
      message: error.message
    });

  }
};


/* SEARCH CATEGORY */

const Searchcategory = async (req, res) => {

  try {

    const { search } = req.query;

    const category = await searchCategory(search);

    return res.status(200).json({
      message: "Search successfully",
      data: category
    });

  } catch (error) {

    return res.status(400).json({
      message: error.message
    });

  }

};
const getPagination = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await getpagination(page, limit);

    const totalPages = Math.ceil(
      result.totalCategories / limit
    );

    return res.status(200).json({
      message: "Successfully fetched categories",
      data: result.categories,
      currentPage: Number(page),
      limit: Number(limit),
      totalCategories: result.totalCategories,
      totalPages: totalPages
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};
const Filtercategory = async(req,res)=>{
try{
  const {sort} = req.query
  const filter = await filterCategory(sort)

  if(filter){
    res.status(200).json({message:"succesfully filter",data:filter})
  }
}
catch(error){

  console.error("FILTER ERROR:", error);

  res.status(400).json({
    message: error.message
  });

}

}
module.exports = {
  adcategory,
  getCategory,
  EditCategory,
  DeleteCategory,
  GetCategoryById,
  Searchcategory,
  getPagination,
  Filtercategory
};