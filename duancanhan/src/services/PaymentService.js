import axios from "axios";

export const getClientConfig = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment/config`)
    return res.data
}

export const createSePayPayment = async (data, token) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/payment/sepay`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return res.data
}
