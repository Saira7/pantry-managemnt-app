import React, { useRef } from 'react';
import Camera from 'react-camera-pro';

const CameraComponent = ({ onTakePhoto }) => {
  const camera = useRef(null);

  return (
    <div>
      <Camera ref={camera} aspectRatio={16 / 9} />
      <button onClick={() => onTakePhoto(camera.current.takePhoto())}>
        Take Photo
      </button>
    </div>
  );
};

export default CameraComponent;
