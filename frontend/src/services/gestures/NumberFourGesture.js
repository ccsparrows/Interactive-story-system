import GestureStrategy from './GestureStrategy';

export default class NumberFourGesture extends GestureStrategy {
  getName() {
    return 'NUMBER_FOUR';
  }

  check(landmarks) {
    const indexIsOpen = this.isFingerOpen(landmarks, 8, 6);
    const middleIsOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringIsOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyIsOpen = this.isFingerOpen(landmarks, 20, 18);

    // 四指必须伸直
    if (!(indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen)) return false;

    // 拇指必须弯曲或内收
    // 判断依据：拇指指尖(4) 到 小指根部(17) 的距离 vs 拇指指尖(4) 到 食指根部(5) 的距离
    // 或者简单地：拇指指尖(4) 靠近 中指根部(9)

    const thumbTip = landmarks[4];
    const middleMCP = landmarks[9]; // 中指根部
    const distThumbMiddle =
      Math.pow(thumbTip.x - middleMCP.x, 2) + Math.pow(thumbTip.y - middleMCP.y, 2);

    const wrist = landmarks[0];
    const indexMCP = landmarks[5];
    const palmSizeSq = Math.pow(wrist.x - indexMCP.x, 2) + Math.pow(wrist.y - indexMCP.y, 2);

    // 如果拇指指尖距离中指根部较近 (小于手掌大小)，认为是内收
    // 这里的阈值需要和 OpenPalm 区分开
    // 调小阈值 (0.8 -> 0.5)，避免 OpenPalm 误识为 4
    return distThumbMiddle < palmSizeSq * 0.5;
  }
}
