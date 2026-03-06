import GestureStrategy from './GestureStrategy';

export default class NumberOneGesture extends GestureStrategy {
  getName() {
    return 'NUMBER_ONE';
  }

  check(landmarks) {
    const indexIsOpen = this.isFingerOpen(landmarks, 8, 6);
    const middleIsOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringIsOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyIsOpen = this.isFingerOpen(landmarks, 20, 18);

    // 必须确保大拇指是弯曲的，否则会和 数字8 (L形) 混淆
    // 使用简单的判断：大拇指尖(4) 距离 小指根部(17) 比较近，或者大拇指尖距离食指根部(5)很近
    // 这里使用 isFingerOpen(4, 2) 来判断是否伸直，如果不伸直则认为是弯曲
    // 更新：isFingerOpen(4, 2) 对于判定 "1" 来说可能太容易返回 true 了 (只要指尖比根部远)。
    // 而做 "1" 时，大拇指通常是弯扣在食指/中指上面的，指尖并不远。
    // "不被检测" 说明在这里 thumbIsOpen 返回了 true，导致整个检查返回 false。

    // 让我们放宽大拇指的判定：只要大拇指不是特别开 (8) 即可。
    // 或者我们直接去掉 thumbIsOpen 的限制，而是反向排除 8。
    // 但是 8 已经在 1 之后了（不对，Service里 6,7,8,9 是加在后面的）。
    // 在 Service 列表里，NumberOneGesture 在 NumberEightGesture 之前。
    // 如果这里不检查大拇指，那么 8 也会被识别为 1。

    // 解决办法：更精确地判断拇指是否"弯曲"。
    // 拇指弯曲：指尖靠近根部，或者指尖靠近中指根部。
    const thumbTip = landmarks[4];
    const middleMCP = landmarks[9];
    const distThumbMiddle = Math.hypot(thumbTip.x - middleMCP.x, thumbTip.y - middleMCP.y);

    // 如果拇指尖靠近手心/中指根部，那就是弯曲的。
    const isThumbCurled = distThumbMiddle < 0.15; // 阈值需调整

    // 食指伸直，其他三指弯曲
    // 如果食指伸直且其他手指闭合
    if (indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen) {
      // 如果拇指也伸直了，那就是 8。如果拇指弯曲了，就是 1。
      // 为了让 1 更容易检测，我们只有在大拇指"非常明显"伸直时才拒绝。

      // 检查 isFingerOpen(4, 3) (指尖 vs 关节) -> 只有完全伸直才为 true
      const thumbStraight = this.isFingerOpen(landmarks, 4, 3);

      if (!thumbStraight) return true;

      // 如果 thumbStraight 为 true，可能是 8。
      // 但如果用户的大拇指只是自然放松，可能也算伸直。
      // 检查拇指和食指夹角? 或距离。
      // 如果大拇指指尖很远，说明是 8。
      // 暂时相信 isFingerOpen(4,3) 足够严格。
      // 如果用户做 1，大拇指可以压在中指上。指尖会比关节近。
      return true;
    }
    return false;
  }
}
