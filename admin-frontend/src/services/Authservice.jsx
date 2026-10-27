import api from "../Api/axios";



export const loginAdmin = async (data) => {

  const response = await api.post(
    "/admin/login",
    data
  );

  return response.data;
};


export const getprofile = async (id) => {

  const response = await api.get(
    `/admin/profile/${id}`
  );

  return response.data;
};


export const profileupdate = async (
  id,
  profileImage
) => {

  const response = await api.put(
    `/admin/profile/${id}`,
    {
      profileImage,
    }
  );

  return response.data;
};

export const adcategory = async (categorydata) => {

  const response = await api.post(
    "/admin/category",
    categorydata
  );

  return response.data;
};

export default loginAdmin;