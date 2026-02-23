const Order = require("../models/OderProduct");
const Product = require("../models/ProductModel");

const createOrder = async (newOrder) => {
    try {
        const { orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, phone, user } = newOrder;

        const promises = orderItems.map(async (order) => {
            const productData = await Product.findOneAndUpdate(
                {
                    _id: order.product,
                    countInStock: { $gte: order.amount }
                },
                {
                    $inc: {
                        countInStock: -order.amount,
                        selled: +order.amount
                    }
                },
                { new: true }
            );
            if (productData) {
                return {
                    status: 'OK',
                    message: 'SUCCESS'
                };
            } else {
                return {
                    status: 'ERR',
                    message: 'ERR',
                    id: order.product
                };
            }
        });

        const results = await Promise.all(promises);
        const newData = results && results.filter((item) => item.id);
        if (newData.length) {
            const arrId = newData.map((item) => item.id);
            return {
                status: 'ERR',
                message: `Sản phẩm với id: ${arrId.join(',')} không đủ hàng`
            };
        }

        const createdOrder = await Order.create({
            oderItems: orderItems,
            shippingAddress: {
                fullName,
                address,
                phone
            },
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            user: user,
        });

        if (createdOrder) {
            return {
                status: 'OK',
                message: 'SUCCESS',
                data: createdOrder
            };
        }
    } catch (e) {
        throw e;
    }
};

const getAllOrder = async () => {
    try {
        const allOrder = await Order.find()
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: allOrder
        };
    } catch (e) {
        throw e;
    }
};

const updateOrder = async (id, data) => {
    try {
        const checkOrder = await Order.findOne({
            _id: id
        })
        if (checkOrder === null) {
            return {
                status: 'ERR',
                message: 'The order is not defined'
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, data, { new: true })
        return {
            status: 'OK',
            message: 'SUCCESS',
            data: updatedOrder
        }
    } catch (e) {
        throw e
    }
}

const getDetailsOrder = async (id) => {
    try {
        const order = await Order.findById({
            _id: id
        })
        if (order === null) {
            return {
                status: 'ERR',
                message: 'The order is not defined'
            }
        }

        return {
            status: 'OK',
            message: 'SUCCES',
            data: order
        }
    } catch (e) {
        throw e
    }
}

const getAllOrderDetails = async (id) => {
    try {
        const order = await Order.find({
            user: id
        })
        if (order === null) {
            return {
                status: 'ERR',
                message: 'The order is not defined'
            }
        }

        return {
            status: 'OK',
            message: 'SUCCES',
            data: order
        }
    } catch (e) {
        throw e
    }
}

module.exports = {
    createOrder,
    getAllOrder,
    updateOrder,
    getDetailsOrder,
    getAllOrderDetails
};
