import GestureStrategy from './GestureStrategy';

export default class WaveGesture extends GestureStrategy {
  getName() {
    return 'WAVE';
  }

  check(landmarks, context) {
    // 挥手是动态手势，需要历史数据
    // context.gestureHistory 应该是一个包含 {x, time} 对象的数组
    if (!context.gestureHistory || context.gestureHistory.length < 5) {
      return false;
    }

    const currentX = landmarks[0].x;

    // 取最近 5 帧的历史数据
    const history = context.gestureHistory.slice(-5);

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
      if (lastDiff !== 0 && Math.sign(diff) !== Math.sign(lastDiff)) {
        directionChanges++;
      }

      // 只有当移动幅度超过一定阈值才更新 lastDiff，避免噪音
      if (Math.abs(diff) > 0.005) {
        lastDiff = diff;
      }
    }

    // 判定条件：总移动量足够大，且有方向改变（左右挥动）
    // 且手指是张开的 (避免握拳移动被误判)
    const isPalmOpen =
      this.isFingerOpen(landmarks, 8) &&
      this.isFingerOpen(landmarks, 12) &&
      this.isFingerOpen(landmarks, 16);

    // 阈值需要根据实际体验微调
    // totalMovement > 0.15 (累计移动距离)
    // directionChanges >= 2 (至少往返一次)
    if (totalMovement > 0.15 && directionChanges >= 2 && isPalmOpen) {
      return true;
    }

    return false;
  }
}
