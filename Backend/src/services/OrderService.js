const Order = require("../models/OderProduct");
const Product = require("../models/ProductModel");

const createOrder = async (newOrder) => {
    try {
        const { oderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, phone, user, isPaid, paidAt } = newOrder;

        const promises = oderItems.map(async (order) => {
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
            oderItems: oderItems,
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
            isPaid,
            paidAt
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

        if (data.status !== undefined) {
            checkOrder.status = data.status
        }

        if (data.status === 3) {
            if (checkOrder.status === 2 || checkOrder.status === 4) {
                return {
                    status: 'ERR',
                    message: 'Không thể hủy đơn khi đang giao hoặc đã giao'
                }
            }
            for (const order of checkOrder.oderItems) {
                await Product.updateOne(
                    { _id: order.product },
                    {
                        $inc: {
                            countInStock: order.amount,
                            selled: -order.amount
                        }
                    }
                )
            }
            checkOrder.status = 3
        }

        if (data.status === 4) {
            checkOrder.isDelivered = true
            checkOrder.deliveredAt = new Date()
        }


        const updatedOrder = await Order.findByIdAndUpdate(id, checkOrder, { new: true })
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
