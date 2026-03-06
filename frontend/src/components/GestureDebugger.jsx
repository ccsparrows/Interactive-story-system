import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import {
  Button,
  Card,
  Col,
  Row,
  Select,
  Typography,
  Space,
  Slider,
  InputNumber,
  Tooltip,
} from 'antd';
import { ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { gestureService } from '../services/gestureService';
import '../styles/GestureCamera.less'; // Reuse existing styles or create new one

const { Title, Text } = Typography;

const GestureDebugger = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const isActiveRef = useRef(true); // 用于立即停止循环

  // Adjusted parameters
  const [minDetectionConfidence, setMinDetectionConfidence] = useState(0.5);
  const [minTrackingConfidence, setMinTrackingConfidence] = useState(0.5);
  // 新增：阈值调试
  const [confirmationThreshold, setConfirmationThreshold] = useState(3);

  const [debugInfo, setDebugInfo] = useState({
    rawGesture: 'None',
    confirmedGesture: 'None',
    stabilityCount: 0,
    fps: 0,
  });

  // FPS calculation
  const fpsRef = useRef({ frames: 0, lastTime: Date.now(), value: 0 });

  // Update MediaPipe options when params change
  useEffect(() => {
    gestureService.updateOptions({
      minDetectionConfidence: minDetectionConfidence,
      minTrackingConfidence: minTrackingConfidence,
    });
  }, [minDetectionConfidence, minTrackingConfidence]);

  // Update confirmation threshold
  useEffect(() => {
    if (gestureService.setConfirmationThreshold) {
      gestureService.setConfirmationThreshold(confirmationThreshold);
    }
  }, [confirmationThreshold]);

  useEffect(() => {
    let isMounted = true; // 添加挂载状态标志

    // Setup debug callback
    gestureService.setDebugCallback((data) => {
      if (!isMounted || !canvasRef.current || !webcamRef.current?.video) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const { videoWidth, videoHeight } = video;

      // Ensure canvas matches video size
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw landmarks
      if (data.multiHandLandmarks) {
        for (const landmarks of data.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 5,
          });
          drawLandmarks(ctx, landmarks, {
            color: '#FF0000',
            lineWidth: 2,
            radius: 3, // Visualize nodes
          });
        }
      }

      // Update debug info UI
      setDebugInfo({
        rawGesture: data.rawGesture || 'None',
        confirmedGesture: data.confirmedGesture || 'None',
        stabilityCount: data.stabilityCount || 0,
        fps: fpsRef.current.value,
      });

      // Valid only for this frame
    });

    // Clean up
    return () => {
      isMounted = false; // 组件卸载时设置标志为 false
      gestureService.setDebugCallback(null);
    };
  }, []);

  // Frame Loop
  useEffect(() => {
    let animationFrameId;
    isActiveRef.current = true;

    const loop = async () => {
      if (!isActiveRef.current) return; // 如果已标记为不活跃，立即停止

      try {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4
        ) {
          // Send video frame to service
          await gestureService.send(webcamRef.current.video);

          // Calculate FPS
          fpsRef.current.frames++;
          const now = Date.now();
          if (now - fpsRef.current.lastTime >= 1000) {
            fpsRef.current.value = fpsRef.current.frames;
            fpsRef.current.frames = 0;
            fpsRef.current.lastTime = now;
          }
        }
      } catch (error) {
        console.error('Error in gesture loop:', error);
      }

      if (isActiveRef.current) {
        // 使用 setTimeout 稍微降低帧率，避免过度占用主线程导致 React 无法响应路由跳转
        animationFrameId = setTimeout(() => {
          requestAnimationFrame(loop);
        }, 10);
      }
    };

    loop();

    return () => {
      isActiveRef.current = false;
      if (animationFrameId) {
        clearTimeout(animationFrameId);
      }
    };
  }, []);

  const gestureMap = {
    THUMB_UP: '竖起大拇指',
    OPEN_PALM: '张开手掌/5',
    VICTORY: '剪刀手/2',
    CLOSED_FIST: '握拳/10',
    WAVE: '挥手',
    HEART: '比心',
    OK: 'OK手势/3',
    NUMBER_ONE: '数字1',
    NUMBER_FOUR: '数字4',
    NUMBER_SIX: '数字6',
    NUMBER_SEVEN: '数字7',
    NUMBER_EIGHT: '数字8',
    NUMBER_NINE: '数字9',
  };

  const getGestureLabel = (key) => {
    if (!key || key === 'None') return '未检测到';
    const name = gestureMap[key] || key;
    return `${name} (${key})`;
  };

  return (
    <div style={{ padding: '20px', height: '100vh', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              isActiveRef.current = false; // 立即停止循环
              navigate('/');
            }}
            size="large"
          >
            返回首页
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            手势识别调试工具
          </Title>
          <div style={{ width: 100 }}></div> {/* Spacer */}
        </div>

        <Row gutter={24}>
          <Col span={16}>
            <Card
              title={
                <span>
                  视频预览 (带骨骼节点)
                  <Tooltip title="红色节点代表手部 21 个关键点，绿色连线代表骨骼结构。">
                    <QuestionCircleOutlined
                      style={{
                        marginLeft: 8,
                        color: '#1890ff',
                        cursor: 'pointer',
                        fontWeight: 'normal',
                      }}
                    />
                  </Tooltip>
                </span>
              }
              bordered={false}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <Webcam
                  ref={webcamRef}
                  mirrored={true}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Mirror canvas to match mirrored webcam
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="调试数据" bordered={false} style={{ height: '100%' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">
                    原始识别结果 (Raw)
                    <Tooltip title="当前帧的实时识别结果，未经过任何防抖处理，可能会闪烁。">
                      <QuestionCircleOutlined
                        style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                      />
                    </Tooltip>{' '}
                    :
                  </Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#1890ff' }}>
                    {getGestureLabel(debugInfo.rawGesture)}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">
                    确认结果 (Confirmed)
                    <Tooltip title="经过防抖处理后的最终结果，用于触发实际的交互动作。">
                      <QuestionCircleOutlined
                        style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                      />
                    </Tooltip>{' '}
                    :
                  </Text>
                  <Title level={3} style={{ margin: '4px 0', color: '#52c41a' }}>
                    {getGestureLabel(debugInfo.confirmedGesture)}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">
                    稳定性计数 (Stability)
                    <Tooltip title="连续多少帧识别出相同手势才确认为该手势。计数越高越稳定，但反应越慢。">
                      <QuestionCircleOutlined
                        style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                      />
                    </Tooltip>{' '}
                    :
                  </Text>
                  <Title level={4} style={{ margin: '4px 0' }}>
                    {debugInfo.stabilityCount}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">
                    FPS
                    <Tooltip title="每秒处理的帧数。数值越高画面越流畅，识别越灵敏。低 FPS 可能导致漏识别。">
                      <QuestionCircleOutlined
                        style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                      />
                    </Tooltip>{' '}
                    :
                  </Text>
                  <Text strong> {debugInfo.fps}</Text>
                </div>

                <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}>
                  <Text strong>参数调试:</Text>

                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text type="secondary">
                        检测置信度 (Detection)
                        <Tooltip title="MediaPipe 检测手部存在的最低置信度。调高可减少误检，但可能在光线差时检测不到手。">
                          <QuestionCircleOutlined
                            style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </Text>
                      <Text>{minDetectionConfidence}</Text>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={minDetectionConfidence}
                      onChange={setMinDetectionConfidence}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text type="secondary">
                        追踪置信度 (Tracking)
                        <Tooltip title="MediaPipe 追踪手部关键点的最低置信度。调高可提高关键点准确度，但更容易丢失追踪。">
                          <QuestionCircleOutlined
                            style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </Text>
                      <Text>{minTrackingConfidence}</Text>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={minTrackingConfidence}
                      onChange={setMinTrackingConfidence}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text type="secondary">
                        确认阈值 (Confirmation)
                        <Tooltip title="需要连续识别多少帧才能确认手势。调低反应快但易抖动，调高反应慢但更稳定。">
                          <QuestionCircleOutlined
                            style={{ marginLeft: 5, color: '#1890ff', cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </Text>
                      <InputNumber
                        min={1}
                        max={10}
                        value={confirmationThreshold}
                        onChange={setConfirmationThreshold}
                        size="small"
                      />
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={confirmationThreshold}
                      onChange={setConfirmationThreshold}
                    />
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default GestureDebugger;
