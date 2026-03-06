import GestureStrategy from './GestureStrategy';

export default class WaveGesture extends GestureStrategy {
  getName() {
    return 'WAVE';
  }

  check(landmarks, context) {
    // 挥手是动态手势，需要历史数据
    // context.gestureHistory 应该是一个包含 {x, time} 对象的数组
    // 降低要求：只要有 10 帧数据即可，适应不同性能设备
    if (!context.gestureHistory || context.gestureHistory.length < 10) {
      return false;
    }

    const currentX = landmarks[0].x;

    // 取最近 12 帧的历史数据 (扩大窗口以捕捉较慢的挥手)
    const history = context.gestureHistory.slice(-12);

    // 将当前帧加入临时计算序列
    const sequence = [...history.map((h) => h.x), currentX];

    let totalMovement = 0;
    let directionChanges = 0;
    let lastDiff = 0;

    for (let i = 1; i < sequence.length; i++) {
      const curr = sequence[i];
      const prev = sequence[i - 1];
      const diff = curr - prev;

      totalMovement += Math.abs(diff);

      // 检测方向变化
      // 为了避免微小抖动造成的方向频繁改变，我们只在移动幅度较大时更新方向
      // 增加阈值 0.01 (1% screen width)
      if (Math.abs(diff) > 0.01) {
        if (lastDiff !== 0 && Math.sign(diff) !== Math.sign(lastDiff)) {
          directionChanges++;
        }
        lastDiff = diff;
      }
    }

    // 判定条件：总移动量足够大，且有方向改变（左右挥动）
    // 且手指是张开的 (避免握拳移动被误判)
    const isPalmOpen =
      this.isFingerOpen(landmarks, 8, 6) &&
      this.isFingerOpen(landmarks, 12, 10) &&
      this.isFingerOpen(landmarks, 16, 14);

    // 阈值调整
    // totalMovement > 0.2 (因为窗口大了，总移动量阈值稍微提高)
    // directionChanges >= 2 (依然至少往返一次 Left-Right-Left)
    if (totalMovement > 0.25 && directionChanges >= 2 && isPalmOpen) {
      return true;
    }

    return false;
  }
}
