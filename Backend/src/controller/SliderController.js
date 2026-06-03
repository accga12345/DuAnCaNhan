const SliderService = require('../services/SliderService');

const createSlider = async (req, res) => {
    try {
        const response = await SliderService.createSlider(req.body);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAllSliders = async (req, res) => {
    try {
        const response = await SliderService.getAllSliders();
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteSlider = async (req, res) => {
    try {
        const response = await SliderService.deleteSlider(req.params.id);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { createSlider, getAllSliders, deleteSlider };
