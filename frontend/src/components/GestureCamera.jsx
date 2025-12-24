import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Spin } from 'antd';
import { gestureService } from '../services/gestureService';
import '../styles/GestureCamera.less';

const GestureCamera = ({ onGestureDetected }) => {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    gestureService.setCallback((gesture, landmarks) => {
      if (gesture && gesture !== 'UNKNOWN') {
        onGestureDetected(gesture, landmarks);
      }
    });

    return () => {
      gestureService.setCallback(null);
    };
  }, [onGestureDetected]);

  useEffect(() => {
    let animationFrameId;

    const detect = async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        await gestureService.send(video);
        setCameraReady(true);
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="gesture-camera-container">
      <div className="camera-frame">
        <Webcam ref={webcamRef} mirrored={true} className="webcam-video" />
        {!cameraReady && (
          <div className="loading-overlay">
            <Spin size="small" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureCamera;
