import api from "../Api/axios";

// GET USERS
export const getuser = async () => {
  const response = await api.get("/admin/userlist");
  return response.data;
};


// BLOCK / UNBLOCK USER
export const isblocked = async (id, status) => {
  const response = await api.put(
    `/admin/userlist/${id}`,
    { status }
  );

  return response.data;
};


// DELETE USER
export const userdelete = async (id) => {
  const response = await api.delete(
    `/admin/userlist/${id}`
  );

  return response.data;
};