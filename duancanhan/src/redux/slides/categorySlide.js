import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    categories: [],
    isLoading: false,
    isError: false,
    isSuccess: false,
}

export const categorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {
        setCategories: (state, action) => {
            state.categories = action.payload;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
    },
})

export const { setCategories, setLoading } = categorySlice.actions

export default categorySlice.reducer
