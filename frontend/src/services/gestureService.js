import { Hands } from '@mediapipe/hands';
import HeartGesture from './gestures/HeartGesture';
import WaveGesture from './gestures/WaveGesture';
import VictoryGesture from './gestures/VictoryGesture';
import ThumbUpGesture from './gestures/ThumbUpGesture';
import ClosedFistGesture from './gestures/ClosedFistGesture';
import OpenPalmGesture from './gestures/OpenPalmGesture';

class GestureService {
  constructor() {
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.onResultsCallback = null;
    this.hands.onResults(this.onResults.bind(this));
    this.history = []; // 用于记录手腕位置历史，检测动态手势

    // 初始化手势策略，顺序很重要 (优先检测复杂/特定手势)
    this.strategies = [
      new HeartGesture(),
      new WaveGesture(),
      new VictoryGesture(),
      new ThumbUpGesture(),
      new ClosedFistGesture(),
      new OpenPalmGesture(),
    ];
  }

  setCallback(callback) {
    this.onResultsCallback = callback;
  }

  async send(videoElement) {
    await this.hands.send({ image: videoElement });
  }

  onResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.history = []; // 没有手时清空历史
      if (this.onResultsCallback) this.onResultsCallback(null);
      return;
    }

    // 更新历史记录 (取第一只手的手腕位置)
    if (results.multiHandLandmarks.length > 0) {
      const wrist = results.multiHandLandmarks[0][0];
      this.updateHistory(wrist);
    }

    let detectedGesture = null;
    let detectedLandmarks = null;

    // 构建上下文
    const context = {
      multiHandLandmarks: results.multiHandLandmarks,
      gestureHistory: this.history,
    };

    // 遍历策略进行检测
    for (const strategy of this.strategies) {
      const name = strategy.getName();

      if (name === 'HEART') {
        // 双手手势，全局检测
        if (strategy.check(null, context)) {
          detectedGesture = name;
          detectedLandmarks = results.multiHandLandmarks[0]; // 默认返回第一只手
          break;
        }
      } else if (name === 'WAVE') {
        // 动态手势，基于主要手（第一只手）的历史
        if (results.multiHandLandmarks.length > 0) {
          if (strategy.check(results.multiHandLandmarks[0], context)) {
            detectedGesture = name;
            detectedLandmarks = results.multiHandLandmarks[0];
            break;
          }
        }
      } else {
        // 单手静态手势 (Victory, ThumbUp, etc.)
        // 检查每一只手
        for (const landmarks of results.multiHandLandmarks) {
          if (strategy.check(landmarks, context)) {
            detectedGesture = name;
            detectedLandmarks = landmarks;
            break;
          }
        }
        if (detectedGesture) break;
      }
    }

    if (this.onResultsCallback) {
      const finalGesture = detectedGesture || 'UNKNOWN';
      const finalLandmarks = detectedGesture ? detectedLandmarks : null;
      this.onResultsCallback(finalGesture, finalLandmarks);
    }
  }

  updateHistory(wrist) {
    const now = Date.now();
    this.history.push({ x: wrist.x, time: now });
    // 只保留最近 1 秒的历史
    this.history = this.history.filter((h) => now - h.time < 1000);
  }
}

export const gestureService = new GestureService();
