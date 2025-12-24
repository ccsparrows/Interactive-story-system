export default class GestureStrategy {
  getName() {
    throw new Error('Method not implemented.');
  }

  check(landmarks, context) {
    throw new Error('Method not implemented.');
  }

  // 辅助方法：判断手指是否伸直
  isFingerOpen(landmarks, fingerTipIndex, fingerPipIndex) {
    // 如果没有提供 PIP 索引，默认取 Tip - 2
    const pipIndex = fingerPipIndex !== undefined ? fingerPipIndex : fingerTipIndex - 2;
    // Y轴向下为正，所以 Tip < Pip 表示伸直向上
    // 注意：这只适用于手掌向上的情况。更严谨的判断应该基于向量角度，但这里简化处理。
    return landmarks[fingerTipIndex].y < landmarks[pipIndex].y;
  }
}
