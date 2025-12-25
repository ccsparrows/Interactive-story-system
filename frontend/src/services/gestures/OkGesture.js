import GestureStrategy from './GestureStrategy';

export default class OkGesture extends GestureStrategy {
  getName() {
    return 'OK';
  }

  check(landmarks) {
    // 1. 拇指(4)和食指(8)指尖距离很近
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distSq = Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2);

    // 参考距离：手腕(0)到食指根部(5)的距离平方
    const wrist = landmarks[0];
    const indexMCP = landmarks[5];
    const palmSizeSq = Math.pow(wrist.x - indexMCP.x, 2) + Math.pow(wrist.y - indexMCP.y, 2);

    // 阈值：指尖距离小于手掌大小的 20% (平方后是 0.04，稍微放宽到 0.1)
    const isPinch = distSq < palmSizeSq * 0.15;

    // 2. 其他三指(中指、无名指、小指)伸直
    const middleIsOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringIsOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyIsOpen = this.isFingerOpen(landmarks, 20, 18);

    return isPinch && middleIsOpen && ringIsOpen && pinkyIsOpen;
  }
}
