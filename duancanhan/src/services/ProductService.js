import axios from "axios";
import { axiosJwt } from "./UserServices";

export const getAllProduct = async (limit, page, sort, filter, isAdmin = false) => {
    let url = `${import.meta.env.VITE_API_URL}/product/get_all?limit=${limit}&page=${page}`
    
    if (sort) {
        url += `&sort=${sort[0]}&sort=${sort[1]}`
    }
    
    if (filter && filter.length > 0) {
        for (let i = 0; i < filter.length; i += 2) {
            if (filter[i] && filter[i + 1]) {
                url += `&filter=${filter[i]}&filter=${filter[i + 1]}`
            }
        }
    }

    if (isAdmin) {
        url += `&isAdmin=true`;
    }

    const res = await axios.get(url)
    return res.data
}

export const getDetailProduct = async (id) => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/product/get_by_id/${id}`)
    return res.data
}

export const createProduct = async (data, access_token) => {
    const res = await axiosJwt.post(`${import.meta.env.VITE_API_URL}/product/create_product`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const updateProduct = async (id, data, access_token) => {
    const res = await axiosJwt.put(`${import.meta.env.VITE_API_URL}/product/update_product/${id}`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const deleteProduct = async (id, access_token) => {
    const res = await axiosJwt.delete(`${import.meta.env.VITE_API_URL}/product/delete_product/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const deleteManyProduct = async (ids, access_token) => {
    const res = await axiosJwt.delete(`${import.meta.env.VITE_API_URL}/product/delete_many_product`, {
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
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/product/get_all_category_product`)
    return res.data
}

export const getProductByCategory = async (id, limit, page, sort, filterArray) => {
    let url = `${import.meta.env.VITE_API_URL}/product/get_all?filter=category&filter=${id}&limit=${limit}&page=${page}`
    
    if (sort) {
        url += `&sort=${sort[0]}&sort=${sort[1]}`
    }
    
    if (filterArray && filterArray.length > 0) {
        for (let i = 0; i < filterArray.length; i += 2) {
            if (filterArray[i] && filterArray[i + 1]) {
                url += `&filter=${filterArray[i]}&filter=${filterArray[i + 1]}`
            }
        }
    }

    const res = await axios.get(url)
    return res.data
}





