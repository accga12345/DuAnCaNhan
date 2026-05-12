import axios from "axios";
import { axiosJwt } from "./UserServices";

export const createBrand = async (data, access_token) => {
    const res = await axiosJwt.post(`${process.env.REACT_APP_API_URL}/brand/create_brand`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateBrand = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${process.env.REACT_APP_API_URL}/brand/update_brand/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getDetailBrand = async (id) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/brand/get_by_id/${id}`)
    return res.data
}

export const getAllBrands = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/brand/get_all`)
    return res.data
}

export const deleteBrand = async (id, access_token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/brand/delete_brand/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}
