import interceptors from "../interceptors/axios.jsx";

// User authentication services
export const userLogin = async (data) => {
  try {
    const res = await interceptors.post("v1/user/login", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

