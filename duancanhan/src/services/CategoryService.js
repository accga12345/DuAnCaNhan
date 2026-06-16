import axios from "axios";
import { axiosJwt } from "./UserServices";

export const createCategory = async (data, access_token) => {
    const res = await axiosJwt.post(`${import.meta.env.VITE_API_URL}/category/create_category`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateCategory = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${import.meta.env.VITE_API_URL}/category/update_category/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getDetailCategory = async (id) => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/category/get_by_id/${id}`)
    return res.data
}

export const getAllCategories = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/category/get_all`)
    return res.data
}

export const deleteCategory = async (id, access_token) => {
    const res = await axiosJwt.delete(`${import.meta.env.VITE_API_URL}/category/delete_category/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}
