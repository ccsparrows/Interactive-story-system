import GestureStrategy from './GestureStrategy';

export default class NumberEightGesture extends GestureStrategy {
  getName() {
    return 'NUMBER_EIGHT';
  }

  check(landmarks) {
    // 中国手势 8：大拇指和食指伸开（呈 L 形）。其他手指闭合。

    // 大拇指检查：使用指尖(4) 与 关节(3) 或 根部(2) 比较。
    // 对 8 的更严格检查：大拇指指尖必须远离食指根部，或者整体处于伸展状态。
    const thumbOpen = this.isFingerOpen(landmarks, 4, 2);

    // 食指必须伸开（相对笔直）
    const indexOpen = this.isFingerOpen(landmarks, 8, 6);

    const middleOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyOpen = this.isFingerOpen(landmarks, 20, 18);

    // 大拇指和食指必须伸开
    if (thumbOpen && indexOpen) {
      // 其他手指必须闭合
      if (!middleOpen && !ringOpen && !pinkyOpen) {
        // 再次检查大拇指的伸展程度，避免与 1 混淆（如果大拇指检测不稳定）
        // 确保大拇指指尖远离食指根部 (5)
        const thumbTip = landmarks[4];
        const indexMCP = landmarks[5];
        const dist = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y);

        // 增加对 7 的反向排除
        // 在 8 中，大拇指和食指是分开的 (L形)
        // 在 7 中，大拇指和食指是捏在一起的
        const indexTip = landmarks[8];
        const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        // 如果大拇指和食指指尖距离太近，说明是捏合状态（比如7），而不是8
        if (distThumbIndex < 0.15) {
          return false;
        }

        // 阈值：相对于手掌大小？
        // 假设如果 isFingerOpen 判断为 "伸开"，那可能就没问题，
        // 但我们还是增加一个小检查来确保是 L 形。
        // 在手势 '1' 中，大拇指指尖通常靠近食指根部或中指根部。
        if (dist > 0.1) {
          // 0.1 是一个粗略的相对阈值
          return true;
        }
      }
    }

    return false;
  }
}
