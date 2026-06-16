import axios from "axios";
import { axiosJwt } from "./UserServices";

export const createSupplier = async (data, access_token) => {
    const res = await axiosJwt.post(`${import.meta.env.VITE_API_URL}/supplier/create_supplier`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateSupplier = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${import.meta.env.VITE_API_URL}/supplier/update_supplier/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getDetailSupplier = async (id) => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/supplier/get_by_id/${id}`)
    return res.data
}

export const getAllSuppliers = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/supplier/get_all`)
    return res.data
}

export const deleteSupplier = async (id, access_token) => {
    const res = await axiosJwt.delete(`${import.meta.env.VITE_API_URL}/supplier/delete_supplier/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}
