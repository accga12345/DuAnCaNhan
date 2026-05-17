import axios from 'axios';

export const getOperatingCost = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/operating-cost/get-details`);
    return res.data;
};

export const updateOperatingCost = async (data, accessToken) => {
    const res = await axios.put(`${process.env.REACT_APP_API_URL}/operating-cost/update`, data, {
        headers: { token: `Bearer ${accessToken}` }
    });
    return res.data;
};