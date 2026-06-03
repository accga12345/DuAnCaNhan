import axios from "axios";
import { axiosJwt } from "./UserServices";

export const createSlider = async (data, access_token) => {
    const res = await axiosJwt.post(`${process.env.REACT_APP_API_URL}/slider/add`, data, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}

export const getAllSliders = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/slider/get-all`)
    return res.data
}

export const deleteSlider = async (id, access_token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/slider/delete/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    })
    return res.data
}
