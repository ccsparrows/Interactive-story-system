import { Hands } from '@mediapipe/hands';
import HeartGesture from './gestures/HeartGesture';
import TwoHandHeartGesture from './gestures/TwoHandHeartGesture'; // 引入新的策略
import WaveGesture from './gestures/WaveGesture';
import VictoryGesture from './gestures/VictoryGesture';
import ThumbUpGesture from './gestures/ThumbUpGesture';
import ClosedFistGesture from './gestures/ClosedFistGesture';
import OpenPalmGesture from './gestures/OpenPalmGesture';
import OkGesture from './gestures/OkGesture';
import NumberOneGesture from './gestures/NumberOneGesture';
import NumberFourGesture from './gestures/NumberFourGesture';
import NumberSixGesture from './gestures/NumberSixGesture';
import NumberSevenGesture from './gestures/NumberSevenGesture';
import NumberEightGesture from './gestures/NumberEightGesture';
import NumberNineGesture from './gestures/NumberNineGesture';

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

    // 优化状态
    this.previousLandmarks = null; // 用于平滑坐标
    this.lastRawGesture = null; // 上一帧的原始手势
    this.stabilityCount = 0; // 连续帧计数器
    this.confirmedGesture = null; // 最终确认的手势

    // 初始化手势策略，顺序很重要 (优先检测复杂/特定手势)
    this.strategies = [
      // new HeartGesture(), // 移除单手比心，避免与 9/10 混淆
      new WaveGesture(), // 动态
      new NumberSevenGesture(), // 7 (捏合，容易误判为2)
      new NumberNineGesture(), // 9 (钩子，容易误判为握拳)
      new NumberEightGesture(), // 8 (八字/枪，容易误判为1) -> 提到 1 前面
      new OkGesture(), // OK / 3
      new VictoryGesture(), // 2
      new NumberSixGesture(), // 6
      new NumberOneGesture(), // 1
      new ThumbUpGesture(),
      new ClosedFistGesture(),
      new NumberFourGesture(), // 4
      new OpenPalmGesture(), // 5 / Open Palm
    ];
    this.confirmationThreshold = 3; // 默认确认阈值
  }

  setCallback(callback) {
    this.onResultsCallback = callback;
  }

  setConfirmationThreshold(value) {
    if (value >= 1) {
      this.confirmationThreshold = value;
    }
  }

  setDebugCallback(callback) {
    this.debugCallback = callback;
  }

  updateOptions(options) {
    this.hands.setOptions(options);
  }

  async send(videoElement) {
    if (!this.hands) return;
    try {
      await this.hands.send({ image: videoElement });
    } catch (error) {
      console.error('Error sending video to MediaPipe:', error);
    }
  }

  onResults(results) {
    let multiHandLandmarks = results.multiHandLandmarks;

    // 1. 坐标平滑 (Exponential Moving Average)
    // 只有当手数量一致时才进行平滑，避免索引错乱
    if (
      multiHandLandmarks &&
      this.previousLandmarks &&
      multiHandLandmarks.length === this.previousLandmarks.length
    ) {
      multiHandLandmarks = multiHandLandmarks.map((hand, handIndex) => {
        return hand.map((point, pointIndex) => {
          const prev = this.previousLandmarks[handIndex][pointIndex];
          return {
            x: point.x * 0.6 + prev.x * 0.4, // 0.6 当前权重, 0.4 历史权重
            y: point.y * 0.6 + prev.y * 0.4,
            z: point.z * 0.6 + prev.z * 0.4,
            visibility: point.visibility, // 保持可见性属性
          };
        });
      });
    }
    this.previousLandmarks = multiHandLandmarks;

    if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
      this.history = []; // 没有手时清空历史
      this.stabilityCount = 0;
      this.lastRawGesture = null;
      this.confirmedGesture = null;
      if (this.onResultsCallback) this.onResultsCallback(null);

      // 确保在没有手的时候也触发 debugCallback，以便清除画布
      if (this.debugCallback) {
        this.debugCallback({
          rawGesture: null,
          confirmedGesture: null,
          stabilityCount: 0,
          multiHandLandmarks: null,
          detectedLandmarks: null,
        });
      }
      return;
    }

    // 更新历史记录 (取第一只手的手腕位置，使用平滑后的坐标)
    if (multiHandLandmarks.length > 0 && multiHandLandmarks[0] && multiHandLandmarks[0][0]) {
      const wrist = multiHandLandmarks[0][0];
      this.updateHistory(wrist);
    }

    let detectedGesture = null;
    let detectedLandmarks = null;

    // 构建上下文
    const context = {
      multiHandLandmarks: multiHandLandmarks,
      gestureHistory: this.history,
    };

    // 优先检测双手比心
    if (multiHandLandmarks.length === 2) {
      // 检查双手比心
      const isHeart = TwoHandHeartGesture.checkTwoHanded(
        multiHandLandmarks[0],
        multiHandLandmarks[1]
      );
      if (isHeart) {
        detectedGesture = 'HEART';
        // 使用第一只手的手腕作为反馈的锚点
        detectedLandmarks = multiHandLandmarks[0];
      }
    }

    if (!detectedGesture) {
      // 遍历策略进行检测
      for (const strategy of this.strategies) {
        const name = strategy.getName();

        if (name === 'WAVE') {
          // 动态手势，基于主要手（第一只手）的历史
          if (multiHandLandmarks.length > 0) {
            if (strategy.check(multiHandLandmarks[0], context)) {
              detectedGesture = name;
              detectedLandmarks = multiHandLandmarks[0];
              break;
            }
          }
        } else {
          // 单手静态手势 (Victory, ThumbUp, etc.)
          // 检查每一只手
          for (const landmarks of multiHandLandmarks) {
            if (strategy.check(landmarks, context)) {
              detectedGesture = name;
              detectedLandmarks = landmarks;
              break;
            }
          }
          if (detectedGesture) break;
        }
      }
    }

    // 2. 结果防抖 (Debounce)
    // 只有连续 N 帧识别出相同手势，才认为有效
    const rawGesture = detectedGesture;

    if (rawGesture === this.lastRawGesture) {
      this.stabilityCount++;
    } else {
      this.stabilityCount = 1;
      this.lastRawGesture = rawGesture;
    }

    // 阈值设置：动态手势稍微灵敏一点，静态手势使用可配置阈值
    // 取消挥挥手的防抖优化 (threshold = 1)，其他手势保持防抖
    const threshold = rawGesture === 'WAVE' ? 1 : this.confirmationThreshold || 3;

    if (this.stabilityCount >= threshold) {
      this.confirmedGesture = rawGesture;
    } else if (rawGesture === null && this.stabilityCount >= threshold) {
      // 如果连续 N 帧都未检测到，则重置
      this.confirmedGesture = null;
    }
    // 注意：如果 count < threshold，保持上一次的 confirmedGesture 不变，或者根据需求返回 null
    // 这里为了体验流畅，我们只在“确认改变”时更新，但在未确认期间，如果之前有 confirmed，可以继续保持，
    // 或者更严格一点：未确认期间不输出。
    // 考虑到交互体验，我们选择：只有满足阈值才更新状态。

    if (this.onResultsCallback) {
      // 如果当前正在确认中（count < threshold），可以选择返回 null 或者 上一次的 confirmed
      // 为了避免误触，建议未达到阈值时，如果新旧手势不同，暂时不触发新动作
      // 但为了 UI 响应，我们始终返回 this.confirmedGesture

      // 特殊情况：如果 confirmedGesture 存在，但当前 rawGesture 变了且还没达到阈值，
      // 我们依然返回 confirmedGesture，这样可以过滤掉偶尔的识别丢失。

      this.onResultsCallback(this.confirmedGesture, detectedLandmarks);
    }

    if (this.debugCallback) {
      this.debugCallback({
        rawGesture,
        confirmedGesture: this.confirmedGesture,
        stabilityCount: this.stabilityCount,
        multiHandLandmarks,
        detectedLandmarks,
      });
    }
  }

  updateHistory(wrist) {
    const now = Date.now();
    this.history.push({ x: wrist.x, time: now });
    // 只保留最近 2 秒的历史，以应对较低帧率的情况（防止历史被过早清空）
    this.history = this.history.filter((h) => now - h.time < 2000);
  }
}

export const gestureService = new GestureService();
