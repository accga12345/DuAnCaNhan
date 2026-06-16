import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { Image, message } from "antd";
import axios from "axios";

const SliderComponent = ({ arrImgs }) => {
  const [sliderImages, setSliderImages] = useState(arrImgs || []);
  const maxSlides = parseInt(localStorage.getItem('sliderMaxSlides')) || 5;
  const autoSpeed = parseInt(localStorage.getItem('sliderAutoSpeed')) || 3000;

  useEffect(() => {
    if (arrImgs) return; // Use props if provided

    const fetchImages = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/slider/get-all`);
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setSliderImages(data);
        } catch (error) {
            console.error("Failed to load sliders", error);
        }
    };
    fetchImages();
  }, [arrImgs]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: autoSpeed,
  };

  if (!sliderImages || sliderImages.length === 0) return null;

  return (
    <Slider {...settings}>
      {sliderImages.slice(0, maxSlides).map((item, index) => (
          <Image key={index} src={item.image || item} alt={"Slider"} width= "100%" height= "274px" preview={false} />
      ))}
    </Slider>
  );
};

export default SliderComponent;
