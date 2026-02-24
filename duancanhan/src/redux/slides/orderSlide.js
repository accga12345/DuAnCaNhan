import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    oderItems: [],
    shippingAddress: {},
    paymentMethod: '',
    itemsPrice: 0,
    shippingPrice: 0,
    totalPrice: 0,
    user: '',
    isPaid: false,
    paidAt: '',
    isDelivered: false,
    deliveredAt: '',
}

export const orderSlide = createSlice({
    name: 'order',
    initialState,
    reducers: {
        addOrderProduct: (state, action) => {
            const { orderItem } = action.payload;

            const itemOrder = state.oderItems.find(
                item => item.product === orderItem.product
            );

            if (itemOrder) {
                itemOrder.amount += orderItem.amount;

                if (itemOrder.amount > itemOrder.countInStock) {
                    itemOrder.amount = itemOrder.countInStock;
                }
            } else {
                state.oderItems.push(orderItem);
            }
        },

        increaseAmount: (state, action) => {
            const { idProduct } = action.payload;

            const item = state.oderItems.find(
                item => item.product === idProduct
            );

            if (item && item.amount < item.countInStock) {
                item.amount += 1;
            }
        },

        decreaseAmount: (state, action) => {
            const { idProduct } = action.payload;

            const item = state.oderItems.find(
                item => item.product === idProduct
            );

            if (item && item.amount > 1) {
                item.amount -= 1;
            }
        },

        removeOrderProduct: (state, action) => {
            const { idProduct } = action.payload;

            state.oderItems = state.oderItems.filter(
                item => item.product !== idProduct
            );
        },

        removeAllOrderProduct: (state, action) => {
            const { listChecked } = action.payload;

            state.oderItems = state.oderItems.filter(
                item => !listChecked.includes(item.product)
            );
        },

        resetOrder: () => initialState
    },
})

export const {
    addOrderProduct,
    increaseAmount,
    decreaseAmount,
    removeOrderProduct,
    removeAllOrderProduct,
    resetOrder
} = orderSlide.actions

export default orderSlide.reducer