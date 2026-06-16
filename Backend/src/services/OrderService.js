const Order = require("../models/OrderProductModel");
const Product = require("../models/ProductModel");
const Warehouse = require("../models/WarehouseModel");
const mongoose = require('mongoose');
const socket = require("../sockets");

const createOrder = async (newOrder) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, phone, user, isPaid, paidAt } = newOrder;
        
        const outOfStockProducts = [];

        for (const order of orderItems) {
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
                { returnDocument: 'after', session }
            );

            if (!productData) {
                await session.abortTransaction();
                session.endSession();
                return {
                    status: 'ERR',
                    message: `Sản phẩm với id: ${order.product} không đủ hàng hoặc không tồn tại`
                };
            }

            if (productData.countInStock <= 0) {
                outOfStockProducts.push(productData.name);
            }
        }

        const generateOrderCode = () => {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(100 + Math.random() * 900);
            return `DH${timestamp}${random}`;
        };

        const createdOrder = await Order.create([{
            orderCode: generateOrderCode(),
            orderItems: orderItems,
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
        }], { session });

        await session.commitTransaction();
        session.endSession();

        if (createdOrder && createdOrder.length > 0) {
            const orderId = createdOrder[0]._id;
            try {
                const socketIO = socket.getIO();
                const Notification = require('../models/NotificationModel');

                const newNotification = await Notification.create({
                    title: 'Đơn hàng mới',
                    body: `Khách hàng ${fullName} vừa đặt một đơn hàng mới trị giá ${totalPrice}đ`,
                    orderId: orderId
                });

                socketIO.emit('new_order', newNotification);

                if (outOfStockProducts.length > 0) {
                    const outOfStockNotif = await Notification.create({
                        title: 'Sản phẩm hết hàng trên Web',
                        body: `Sản phẩm ${outOfStockProducts.join(', ')} đã hết hàng trên gian hàng trực tuyến. Vui lòng kiểm tra và cập nhật thêm số lượng!`,
                    });
                    socketIO.emit('new_order', outOfStockNotif);
                }
            } catch (err) {
                console.error("Lỗi khi gửi thông báo socket:", err);
            }

            return {
                status: 'OK',
                message: 'SUCCESS',
                data: createdOrder[0]
            };
        }
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const checkOrder = await Order.findOne({ _id: id }).session(session);
        if (checkOrder === null) {
            await session.abortTransaction();
            session.endSession();
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
                await session.abortTransaction();
                session.endSession();
                return {
                    status: 'ERR',
                    message: 'Không thể hủy đơn khi đang giao hoặc đã giao'
                }
            }
            for (const order of checkOrder.orderItems) {
                const productUpdate = await Product.updateOne(
                    { _id: order.product },
                    {
                        $inc: {
                            countInStock: order.amount,
                            selled: -order.amount
                        }
                    },
                    { session }
                );
                if (productUpdate.modifiedCount === 0) {
                    await session.abortTransaction();
                    session.endSession();
                    return {
                        status: 'ERR',
                        message: 'Lỗi khi hoàn lại sản phẩm'
                    }
                }
            }
            checkOrder.status = 3
            // Reset trạng thái thanh toán khi hủy đơn (đặc biệt cho PayPal)
            checkOrder.isPaid = false
            checkOrder.paidAt = null
        }

        if (data.status === 4) {
            checkOrder.isDelivered = true
            checkOrder.deliveredAt = new Date()
            // Tự động cập nhật đã thanh toán khi giao hàng thành công
            if (!checkOrder.isPaid) {
                checkOrder.isPaid = true
                checkOrder.paidAt = new Date()
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, checkOrder, { returnDocument: 'after', session })

        await session.commitTransaction();
        session.endSession();

        try {
            const socketIO = socket.getIO();
            const Notification = require('../models/NotificationModel');

            const statusText = data.status === 3 ? 'đã bị hủy' : (data.status === 4 ? 'đã được giao thành công' : 'đã được cập nhật trạng thái');
            const newNotification = await Notification.create({
                title: 'Cập nhật đơn hàng',
                body: `Đơn hàng của bạn ${statusText}`,
                orderId: updatedOrder._id,
                userId: updatedOrder.user
            });

            socketIO.emit('user_notification', newNotification);
        } catch (err) {
            console.error("Lỗi khi gửi thông báo socket cho user:", err);
        }

        return {
            status: 'OK',
            message: 'SUCCESS',
            data: updatedOrder
        }
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
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

const updateOrderReview = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById(id).populate('orderItems.product');
            const updatedOrder = await Order.findByIdAndUpdate(id, data, { returnDocument: 'after' });

            for (const item of order.orderItems) {
                const product = await Product.findByIdAndUpdate(item.product, {
                    $push: {
                        reviews: {
                            user: order.user,
                            rating: data.rating,
                            comment: data.comment
                        }
                    }
                }, { returnDocument: 'after' });

                if (product && product.reviews && product.reviews.length > 0) {
                    const totalRating = product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                    const count = product.reviews.length;
                    const averageRating = Math.round(totalRating / count);
                    await Product.findByIdAndUpdate(item.product, { rating: averageRating });
                }
                
                try {
                    const socketIO = socket.getIO();
                    socketIO.emit('new_review', { productId: item.product });
                } catch (err) {
                    console.error("Lỗi khi gửi thông báo socket review:", err);
                }
            }

            resolve({
                status: 'OK',
                message: 'Đánh giá thành công',
                data: updatedOrder
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createOrder,
    getAllOrder,
    updateOrder,
    getDetailsOrder,
    getAllOrderDetails,
    updateOrderReview
};