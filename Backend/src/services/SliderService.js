const Slider = require("../models/SliderModel");

const createSlider = async (newSlider) => {
    try {
        const slider = await Slider.create(newSlider);
        return { status: "success", data: slider };
    } catch (error) {
        throw error;
    }
};

const getAllSliders = async () => {
    try {
        const sliders = await Slider.find().sort({ order: 1 });
        return { status: "success", data: sliders };
    } catch (error) {
        throw error;
    }
};

const deleteSlider = async (id) => {
    try {
        const slider = await Slider.findByIdAndDelete(id);
        return { status: "success", data: slider };
    } catch (error) {
        throw error;
    }
};

module.exports = { createSlider, getAllSliders, deleteSlider };
