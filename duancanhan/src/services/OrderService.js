import { axiosJwt } from "./UserServices";

export const createOrder = async (data, access_token) => {
    const res = await axiosJwt.post(`${import.meta.env.VITE_API_URL}/order/create/${data.user}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const getAllOrder = async (access_token) => {
    const res = await axiosJwt.get(`${import.meta.env.VITE_API_URL}/order/get-all`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const updateOrder = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${import.meta.env.VITE_API_URL}/order/update/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const getDetailsOrder = async (id, access_token) => {
    const res = await axiosJwt.get(`${import.meta.env.VITE_API_URL}/order/get-details/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const getOrderByUserId = async (id, access_token) => {
    const res = await axiosJwt.get(`${import.meta.env.VITE_API_URL}/order/get-all-order/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const updateOrderReview = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${import.meta.env.VITE_API_URL}/order/update-review/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    });
    return res.data;
};

export const deleteManyOrder = async (ids, access_token) => {
    const res = await axiosJwt.delete(`${import.meta.env.VITE_API_URL}/order/delete_many_order`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        data: {
            ids
        }
    });
    return res.data;
};

