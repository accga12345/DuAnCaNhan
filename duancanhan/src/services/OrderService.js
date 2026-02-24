import { axiosJwt } from "./UserServices";

export const createOrder = async (data, access_token) => {
    const res = await axiosJwt.post(`${process.env.REACT_APP_API_URL}/order/create/${data.user}`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const getAllOrder = async (access_token) => {
    const res = await axiosJwt.get(`${process.env.REACT_APP_API_URL}/order/get-all`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const updateOrder = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${process.env.REACT_APP_API_URL}/order/update/${id}`, data, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const getDetailsOrder = async (id, access_token) => {
    const res = await axiosJwt.get(`${process.env.REACT_APP_API_URL}/order/get-details/${id}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const getOrderByUserId = async (id, access_token) => {
    const res = await axiosJwt.get(`${process.env.REACT_APP_API_URL}/order/get-all-order/${id}`, {
        headers: {
            token: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

