import axios from "axios";
import { jwtDecode } from 'jwt-decode';
import { isJsonString } from '../ultil';

export const axiosJwt = axios.create();

axiosJwt.interceptors.request.use(
    async (config) => {
      let token = localStorage.getItem("access_token");
  
      if (token && isJsonString(token)) {
        token = JSON.parse(token);
        const decode = jwtDecode(token);
  
        if (decode.exp * 1000 < Date.now()) {
          try {
            let data = await refreshToken();
            token = data.accessToken;
            localStorage.setItem("access_token", JSON.stringify(token));
          } catch (err) {
            localStorage.removeItem("access_token");
            return Promise.reject(err);
          }
        }
  
        config.headers.Authorization = `Bearer ${token}`;
      }
  
      return config;
    },
    (error) => Promise.reject(error)
);

export const loginUser = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/signin`, data, {
        withCredentials: true
    });
    return res.data;
};

export const registerUser = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/signup`, data);
    return res.data;
};

export const getDetailUser = async (id, token) => {
    const res = await axiosJwt.get(
        `${process.env.REACT_APP_API_URL}/user/get_by_id/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return res.data;
};

export const refreshToken = async () => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/refresh_token`, {},
        {
            withCredentials: true
        }
    );
    return res.data;
};

export const logoutUser = async () => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/logout`, {}, {
        withCredentials: true
    });
    return res.data;
};

export const getAllUser = async (token) => {
    const res = await axiosJwt.get(`${process.env.REACT_APP_API_URL}/user/get_all`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
}

export const deleteUser = async (id, token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/user/delete/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
}

export const updateUserInfo = async (id, data, token) => {
    const res = await axiosJwt.put(`${process.env.REACT_APP_API_URL}/user/update/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
}

export const deleteManyUser = async (ids, token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/user/delete_many_user`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        data: {
            ids
        }
    });
    return res.data;
}

export const forgotPassword = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/forgot-password`, data);
    return res.data;
};

export const resetPassword = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/reset-password`, data);
    return res.data;
};

export const sendOtp = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/send-otp`, data);
    return res.data;
};
