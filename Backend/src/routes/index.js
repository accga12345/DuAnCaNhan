const UserRouter = require('./UserRouter')
const ProductRouter = require('./ProductRouter')
const OrderRouter = require('./OrderRouter')
const PaymentRouter = require('./PaymentRouter')
const CategoryRouter = require('./CategoryRouter')
const NotificationRouter = require('./NotificationRouter')
const BrandRouter = require('./BrandRouter')
const SupplierRouter = require('./SupplierRouter')
const WarehouseRouter = require('./WarehouseRouter')
const OperatingCostRouter = require('./OperatingCostRouter')
const ChatRouter = require('./ChatRouter')

const UploadRouter = require('./UploadRouter')

const routes = (app) => {
  app.use('/api/user', UserRouter)
  app.use('/api/product', ProductRouter)
  app.use('/api/order', OrderRouter)
  app.use('/api/payment', PaymentRouter)
  app.use('/api/category', CategoryRouter)
  app.use('/api/notification', NotificationRouter)
  app.use('/api/brand', BrandRouter)
  app.use('/api/supplier', SupplierRouter)
  app.use('/api/warehouse', WarehouseRouter)
  app.use('/api/operating-cost', OperatingCostRouter)
  app.use('/api/chat', ChatRouter)
  app.use('/api/upload', UploadRouter)
}

module.exports = routes