import GestureStrategy from './GestureStrategy';

export default class OpenPalmGesture extends GestureStrategy {
  getName() {
    return 'OPEN_PALM';
  }

  check(landmarks) {
    const indexIsOpen = this.isFingerOpen(landmarks, 8, 6);
    const middleIsOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringIsOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyIsOpen = this.isFingerOpen(landmarks, 20, 18);

    // 四指伸直
    const fourFingersOpen = indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen;

    if (!fourFingersOpen) return false;

    // 增加对 Heart 的防误判
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    // 如果拇指和食指尖太近，即使 fingersOpen 判定为真，也不是 OpenPalm
    if (distThumbIndex < 0.05) return false;

    // 区分 OpenPalm (5) 和 NumberFour (4)
    // OpenPalm 要求拇指张开（远离手掌中心）
    const middleMCP = landmarks[9];
    const distThumbMiddle =
      Math.pow(thumbTip.x - middleMCP.x, 2) + Math.pow(thumbTip.y - middleMCP.y, 2);

    const wrist = landmarks[0];
    const indexMCP = landmarks[5];
    const palmSizeSq = Math.pow(wrist.x - indexMCP.x, 2) + Math.pow(wrist.y - indexMCP.y, 2);

    // 拇指必须远离中指根部
    // 调小阈值 (0.8 -> 0.6)，允许拇指稍微放松
    return distThumbMiddle > palmSizeSq * 0.6;
  }
}
