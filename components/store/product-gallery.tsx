"use client";

import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="gallery-shell">
      <div className="gallery-main">
        <img src={selectedImage} alt={alt} className="gallery-main-image" />
      </div>
      <div className="gallery-strip">
        {images.map((image) => (
          <button
            key={image}
            type="button"
            className={
              image === selectedImage
                ? "gallery-thumb active"
                : "gallery-thumb"
            }
            onClick={() => setSelectedImage(image)}
          >
            <img src={image} alt={alt} className="gallery-thumb-image" />
          </button>
        ))}
      </div>
    </div>
  );
}
