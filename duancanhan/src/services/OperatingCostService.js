import axios from 'axios';

export const getOperatingCost = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/operating-cost/get-details`);
    return res.data;
};

export const updateOperatingCost = async (data, accessToken) => {
    const res = await axios.put(`${import.meta.env.VITE_API_URL}/operating-cost/update`, data, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.data;
};