import axios from "axios";
import { axiosJwt } from "./UserServices";

export const getAllProduct = async (limit, page, sort, filter) => {
    let url = `${process.env.REACT_APP_API_URL}/product/get_all?limit=${limit}&page=${page}`
    
    if (sort) {
        // sort format expected by backend: array [order, field]
        url += `&sort=${sort[0]}&sort=${sort[1]}`
    }
    
    if (filter) {
        // filter format expected by backend: array [field, value]
        url += `&filter=${filter[0]}&filter=${filter[1]}`
    }

    const res = await axios.get(url)
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

export const getAllCategoryProduct = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get_all_category_product`)
    return res.data
}

export const getProductByCategory = async (id, limit, page, sort, ratingFilter) => {
    let url = `${process.env.REACT_APP_API_URL}/product/get_all?filter=category&filter=${id}&limit=${limit}&page=${page}`
    
    if (sort) {
        url += `&sort=${sort[0]}&sort=${sort[1]}`
    }
    
    if (ratingFilter) {
        url += `&filter=rating&filter=${ratingFilter}`
    }

    const res = await axios.get(url)
    return res.data
}





