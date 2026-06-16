import axios from "axios";
import { axiosJwt } from "./UserServices";

export const createWarehouseItem = async (data, access_token) => {
    const res = await axiosJwt.post(`${import.meta.env.VITE_API_URL}/warehouse/create`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateWarehouseItem = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${import.meta.env.VITE_API_URL}/warehouse/update/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getDetailWarehouseItem = async (id) => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/warehouse/get_by_id/${id}`)
    return res.data
}

export const getAllWarehouseItems = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/warehouse/get_all`)
    return res.data
}

export const deleteWarehouseItem = async (id, access_token) => {
    const res = await axiosJwt.delete(`${import.meta.env.VITE_API_URL}/warehouse/delete/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}
