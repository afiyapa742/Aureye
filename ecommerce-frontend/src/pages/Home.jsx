
import React, {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import API from "../api/axios";

import "./Home.css";
import OfferAnnouncements from "../components/offerpopup";
import bestbg from "../assets/bestbg.png";
/* =========================================================
   BEST SELLER PRODUCT CARD
========================================================= */

const BestSellerCard = ({
  product,
  variant,
  images,
  getImageUrl,
  navigate,
  getProductUrl
}) => {

  const [currentImage, setCurrentImage] =
    useState(0);

  const [isHovered, setIsHovered] =
    useState(false);


  /* =======================================================
     AUTOMATIC IMAGE SLIDER

     Image changes every 4 seconds.
     Slider stops while mouse is over image.
  ======================================================= */

  useEffect(() => {

    if (images.length <= 1) {
      return;
    }

    if (isHovered) {
      return;
    }

    const interval = setInterval(() => {

      setCurrentImage((prev) => {

        if (prev >= images.length - 1) {
          return 0;
        }

        return prev + 1;

      });

    }, 4000);


    return () => {
      clearInterval(interval);
    };

  }, [images.length, isHovered]);


  /* =======================================================
     CURRENT IMAGE
  ======================================================= */

  const image =
    images[currentImage]?.imageUrl;


  return (

    <div
      className="product-card"
      onClick={() =>
        navigate(
          getProductUrl(product._id)
        )
      }
    >

      {/* ===================================================
          PRODUCT IMAGE
      =================================================== */}

      <div
        className="product-img-wrap"

        onMouseEnter={() =>
          setIsHovered(true)
        }

        onMouseLeave={() =>
          setIsHovered(false)
        }
      >

        <img
          src={getImageUrl(image)}
          alt={product.productName}
          className="product-image"
        />

      </div>


      {/* ===================================================
          PRODUCT INFORMATION
      =================================================== */}

      <div className="product-info">

        <p className="product-name">
          {product.productName}
        </p>

        <p className="product-price">
          ₹{variant.price}
        </p>

      </div>

    </div>

  );

};



/* =========================================================
   HOME
========================================================= */

const Home = () => {

  const [categories, setCategories] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const navigate = useNavigate();


  /* =======================================================
     FETCH CATEGORIES
  ======================================================= */

  useEffect(() => {

    const fetchCategories = async () => {

      try {

        const response =
          await API.get("/auth/category");

        console.log(
          "CATEGORY RESPONSE:",
          response.data
        );

        setCategories(
          response.data?.data || []
        );

      } catch (error) {

        console.error(
          "CATEGORY FETCH ERROR:",
          error
        );

        setCategories([]);

      }

    };


    fetchCategories();

  }, []);



  /* =======================================================
     FETCH BEST SELLERS
  ======================================================= */

  useEffect(() => {

    const fetchBestSellers = async () => {

      try {

        const response =
          await API.get(
            "/product/bestsellers"
          );

        console.log(
          "BEST SELLERS RESPONSE:",
          response.data
        );

        setProducts(
          response.data?.data || []
        );

      } catch (error) {

        console.error(
          "BEST SELLERS FETCH ERROR:",
          error
        );

        setProducts([]);

      }

    };


    fetchBestSellers();

  }, []);



  /* =======================================================
     IMAGE URL
  ======================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(
    /\/api\/?$/,
    ""
  );

  let imagePath = String(image).trim();

  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(imagePath)) {
      return imagePath;
    }

    imagePath = imagePath.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
      ""
    );
  }

  imagePath = imagePath.replace(/^\/+/, "");

  if (imagePath.startsWith("uploads/")) {
    return `${API_ORIGIN}/${imagePath}`;
  }

  return `${API_ORIGIN}/uploads/${imagePath}`;
};


  /* =======================================================
     CATEGORY URL
  ======================================================= */

  const getCategoryUrl = (categoryId) => {

    return `/category/${categoryId}`;

  };



  /* =======================================================
     PRODUCT DETAIL URL
  ======================================================= */

  const getProductUrl = (productId) => {

    return `/productdetail/${productId}`;

  };



  /* =======================================================
     HOME BANNER CATEGORY
  ======================================================= */

  const bannerCategory =
    categories.find(
      (category) =>
        category.status === "Active" &&
        category.isHomeBanner === true
    );



  /* =======================================================
     AVAILABLE BEST SELLERS

     - Product is removed if it has no variants
     - Product is removed if ALL variants are sold out
     - Product is displayed if ANY variant has stock
     - First available variant is used
     - Maximum 4 products are displayed
  ======================================================= */

  const availableBestSellers =
    products
      .map((product) => {

        const variants =
          product.variants || [];


        /* No variants */

        if (variants.length === 0) {
          return null;
        }


        /* Find first variant with stock */

        const availableVariant =
          variants.find(
            (variant) =>
              Number(
                variant.stock || 0
              ) > 0
          );


        /* All variants are sold out */

        if (!availableVariant) {
          return null;
        }


        /* Return product with available variant */

        return {
          ...product,

          displayVariant:
            availableVariant
        };

      })

      .filter(Boolean)

      .slice(0, 8);



  /* =========================================================
     HOME
  ========================================================= */

  return (

    <>

      {/* OFFER ANNOUNCEMENT POPUP */}
      <OfferAnnouncements />

      <div className="home-page">


        {/* ===================================================
            HERO / MAIN BANNER
        =================================================== */}

        {bannerCategory && (

          <section className="hero-section">

            <div className="hero-overlay"></div>


            <img
              src={getImageUrl(
                bannerCategory.image
              )}

              alt={
                bannerCategory.categoryName
              }

              className="hero-img"
            />


            <div className="hero-content">

              <p className="hero-eyebrow">
                New Arrival
              </p>


              <h1 className="hero-title">
                {bannerCategory.description}
              </h1>


              <p className="hero-sub">

                Shop our{" "}

                {bannerCategory.categoryName}{" "}

                collection

              </p>


              <button
                className="btn btn-hero"

                onClick={() =>
                  navigate(
                    getCategoryUrl(
                      bannerCategory._id
                    )
                  )
                }
              >
                Shop Collection
              </button>

            </div>

          </section>

        )}



        {/* ===================================================
            TAGLINE
        =================================================== */}

        <div className="tagline-strip">

          <p>

            It started with a simple idea:

            Create quality, well-designed

            products that I wanted myself.

          </p>

        </div>



        {/* ===================================================
            CATEGORY SECTION
        =================================================== */}

        <section
          className="
            category-section
            container-fluid
            px-4
            mb-5
          "
        >

          <div className="row g-3">

            {categories

              .filter(
                (category) =>
                  category.status === "Active" &&
                  category.isHomeBanner === false
              )

              .map((category) => (

                <div
                  className="col-12 col-md-6"

                  key={category._id}
                >

                  <div className="cat-card">

                    <img
                      src={getImageUrl(
                        category.image
                      )}

                      alt={
                        category.categoryName
                      }
                    />


                    <div className="cat-label">

                      <Link
                        to={getCategoryUrl(
                          category._id
                        )}

                        className="cat-link"
                      >

                        Shop{" "}

                        {category.categoryName}{" "}

                        Collection

                      </Link>

                    </div>

                  </div>

                </div>

              ))}

          </div>

        </section>



        {/* ===================================================
            BEST SELLERS
        =================================================== */}

        <section
     className="bestsellers container px-4 mb-5"
  style={{ "--best-bg": `url("${bestbg}")` }}
>
  <h2 className="section-title">
    BEST SELLERS
  </h2>


          <div className="row g-4">

            {availableBestSellers.length === 0 ? (

              <div className="col-12">

                <p className="no-products">

                  No best selling products
                  available yet.

                </p>

              </div>

            ) : (

              availableBestSellers.map(
                (product) => {

                  /*
                    Use the first variant
                    that actually has stock.
                  */

                  const variant =
                    product.displayVariant;


                  const images =
                    variant?.productImages || [];


                  return (

                    <div
                      className="col-6 col-md-3"

                      key={product._id}
                    >

                      <BestSellerCard

                        product={product}

                        variant={variant}

                        images={images}

                        getImageUrl={
                          getImageUrl
                        }

                        navigate={navigate}

                        getProductUrl={
                          getProductUrl
                        }

                      />

                    </div>

                  );

                }
              )

            )}

          </div>

        </section>


      </div>

    </>

  );

};


export default Home;
