import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    orderItems: [],
    shippingAddress: {},
    paymentMethod: '',
    itemsPrice: 0,
    shippingPrice: 0,
    taxPrice: 0,
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
            const itemOrder = state?.orderItems?.find((item) => item?.product === orderItem.product);
            if (itemOrder) {
                itemOrder.amount += orderItem?.amount;
                if (itemOrder.amount > itemOrder.countInstock) {
                    itemOrder.amount = itemOrder.countInstock;
                }
            } else {
                state.orderItems.push(orderItem);
            }
        },
        increaseAmount: (state, action) => {
            const { idProduct } = action.payload;
            const itemOrder = state?.orderItems?.find((item) => item?.product === idProduct);
            if (itemOrder && itemOrder.amount < itemOrder.countInstock) {
                itemOrder.amount++;
            }
        },
        decreaseAmount: (state, action) => {
            const { idProduct } = action.payload;
            const itemOrder = state?.orderItems?.find((item) => item?.product === idProduct);
            if (itemOrder && itemOrder.amount > 1) {
                itemOrder.amount--;
            }
        },
        removeOrderProduct: (state, action) => {
            const { idProduct } = action.payload;
            const itemOrder = state?.orderItems?.filter((item) => item?.product !== idProduct);
            state.orderItems = itemOrder;
        },
        removeAllOrderProduct: (state, action) => {
            const { listChecked } = action.payload;
            const itemOrders = state?.orderItems?.filter((item) => !listChecked.includes(item.product));
            state.orderItems = itemOrders;
        },
        resetOrder: (state) => {
            state.orderItems = [];
            state.shippingAddress = {};
            state.paymentMethod = '';
            state.itemsPrice = 0;
            state.shippingPrice = 0;
            state.taxPrice = 0;
            state.totalPrice = 0;
            state.user = '';
            state.isPaid = false;
            state.paidAt = '';
            state.isDelivered = false;
            state.deliveredAt = '';
        }
    },
})

export const { addOrderProduct, increaseAmount, decreaseAmount, removeOrderProduct, removeAllOrderProduct, resetOrder } = orderSlide.actions

export default orderSlide.reducer
