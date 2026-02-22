import axios from "axios";
import { axiosJwt } from "./UserServices";

export const getAllProduct = async (limit, page) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get_all?limit=${limit}&page=${page}`)
    return res.data
}

export const getDetailProduct = async (id) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get_by_id/${id}`)
    return res.data
}

export const createProduct = async (data, access_token) => {
    const res = await axiosJwt.post(`${process.env.REACT_APP_API_URL}/product/create_product`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateProduct = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${process.env.REACT_APP_API_URL}/product/update_product/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const deleteProduct = async (id, access_token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/product/delete_product/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const deleteManyProduct = async (ids, access_token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/product/delete_many_product`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        data: {
            ids
        }
    })
    return res.data
}

export const getAllTypeProduct = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get_all_type_product`)
    return res.data
}

export const getProductType = async (type, filterType, filterValue) => {
    let url = `${process.env.REACT_APP_API_URL}/product/get_all?filter=type&filter=${type}`;
    if (filterType && filterValue) {
        url += `&filter=${filterType}&filter=${filterValue}`;
    }
    const res = await axios.get(url);
    return res.data;
}




