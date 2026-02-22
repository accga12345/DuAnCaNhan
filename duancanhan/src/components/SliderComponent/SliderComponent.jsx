import React from "react";
import Slider from "react-slick";
import { Image } from "antd";

const SliderComponent = ({ arrImgs }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <Slider {...settings}>
      {arrImgs.map((imgSrc) => (
          <Image src={imgSrc} alt={"Slider"} width= "100%" height= "274px" preview={false} />
      ))}
    </Slider>
  );
};

export default SliderComponent;
