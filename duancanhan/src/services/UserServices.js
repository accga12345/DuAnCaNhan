import axios from "axios";

export const axiosJwt = axios.create();

export const loginUser = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/signin`, data);
    return res.data;
};

export const registerUser = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/signup`, data);
    return res.data;
};

export const getDetailUser = async (id, token) => {
    const res = await axiosJwt.get(
        `${process.env.REACT_APP_API_URL}/user/get_by_id/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return res.data;
};


export const refreshToken = async () => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/refresh_token`, {},
        {
            withCredentials: true
        }
    );
    return res.data;
};

export const logoutUser = async () => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/logout`);
    return res.data;
};


export const getAllUser = async (token) => {
    const res = await axiosJwt.get(`${process.env.REACT_APP_API_URL}/user/get_all`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
}

export const deleteUser = async (id, token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/user/delete/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
}

export const updateUserInfo = async (id, data, token) => {
    const res = await axiosJwt.put(`${process.env.REACT_APP_API_URL}/user/update/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
}

export const deleteManyUser = async (ids, token) => {
    const res = await axiosJwt.delete(`${process.env.REACT_APP_API_URL}/user/delete_many_user`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        data: {
            ids
        }
    });
    return res.data;
}


