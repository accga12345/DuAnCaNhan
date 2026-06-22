const OperatingCost = require('../models/OperatingCostModel');

const getOperatingCost = async (req, res) => {
    try {
        let cost = await OperatingCost.findOne();
        if (!cost) {
            cost = await OperatingCost.create({});
        }
        return res.status(200).json({ status: 'OK', data: cost });
    } catch (error) {
        return res.status(500).json({ status: 'ERR', message: error.message });
    }
};

const updateOperatingCost = async (req, res) => {
    try {
        const { rentCost } = req.body;
        let cost = await OperatingCost.findOne();
        if (!cost) {
            cost = await OperatingCost.create({ rentCost });
        } else {
            cost.rentCost = rentCost ?? cost.rentCost;
            await cost.save();
        }
        return res.status(200).json({ status: 'OK', message: 'Cập nhật thành công', data: cost });
    } catch (error) {
        return res.status(500).json({ status: 'ERR', message: error.message });
    }
};

module.exports = { getOperatingCost, updateOperatingCost };