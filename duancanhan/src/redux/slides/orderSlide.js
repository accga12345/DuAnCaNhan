import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    orderItems: [],
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
            if (!state.orderItems) {
                state.orderItems = [];
            }
            const itemOrder = state.orderItems.find(
                item => item.product === orderItem.product
            );

            if (itemOrder) {
                itemOrder.amount += orderItem.amount;
                const maxStock = itemOrder.countInStock || itemOrder.countInstock || orderItem.countInStock || orderItem.countInstock;
                if (itemOrder.amount > maxStock) {
                    itemOrder.amount = maxStock;
                }
            } else {
                state.orderItems.push(orderItem);
            }
        },

        increaseAmount: (state, action) => {
            const { idProduct } = action.payload;
            if (!state.orderItems) {
                state.orderItems = [];
            }
            const item = state.orderItems.find(
                item => item.product === idProduct
            );

            if (item) {
                const maxStock = item.countInStock || item.countInstock;
                if (item.amount < maxStock) {
                    item.amount += 1;
                }
            }
        },

        decreaseAmount: (state, action) => {
            const { idProduct } = action.payload;
            if (!state.orderItems) {
                state.orderItems = [];
            }
            const item = state.orderItems.find(
                item => item.product === idProduct
            );

            if (item && item.amount > 1) {
                item.amount -= 1;
            }
        },

        removeOrderProduct: (state, action) => {
            const { idProduct } = action.payload;
            if (!state.orderItems) {
                state.orderItems = [];
            }
            state.orderItems = state.orderItems.filter(
                item => item.product !== idProduct
            );
        },

        removeAllOrderProduct: (state, action) => {
            const { listChecked } = action.payload;
            if (!state.orderItems) {
                state.orderItems = [];
            }
            state.orderItems = state.orderItems.filter(
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