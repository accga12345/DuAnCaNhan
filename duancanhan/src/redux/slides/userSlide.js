import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    _id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    accessToken: '',
    isAdmin: false,
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        updateUser: (state, action) => {
            const { _id, name, email, phone, address, avatar, accessToken, isAdmin } = action.payload;
            state._id = _id;
            state.name = name;
            state.email = email;
            state.phone = phone;
            state.address = address;
            state.avatar = avatar;
            state.accessToken = accessToken
            state.isAdmin = isAdmin
        },
        resetUser: (state) => {
            state._id = '';
            state.name = '';
            state.email = '';
            state.phone = '';
            state.address = '';
            state.avatar = '';
            state.accessToken = '';
            state.isAdmin = false;
        },
    },
})


export const { updateUser, resetUser } = userSlice.actions

export default userSlice.reducer