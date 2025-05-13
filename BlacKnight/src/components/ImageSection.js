// src/components/ImageSection.js
import React from "react";
import blacknightImage from "../images/blacknight.png";

const ImageSection = () => {
  return (
    <div className="image-container">
      <img
        src={blacknightImage}
        alt="The Blacknight: GenAI, who writes articles for you"
        className="blacknight-image"
        width={250}
      />
      <p className="image-caption">
        The Blacknight: GenAI, who writes articles for you
      </p>
    </div>
  );
};

export default ImageSection;
