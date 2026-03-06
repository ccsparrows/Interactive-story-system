import GestureStrategy from './GestureStrategy';

export default class VictoryGesture extends GestureStrategy {
  getName() {
    return 'VICTORY';
  }

  check(landmarks) {
    const indexIsOpen = this.isFingerOpen(landmarks, 8, 6);
    const middleIsOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringIsOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyIsOpen = this.isFingerOpen(landmarks, 20, 18);

    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const thumbTip = landmarks[4];

    // 计算指尖距离
    const distIndexMiddle = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);
    const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const distThumbMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);

    // 2手势中，食指和中指应该分开 (V字形)
    const isVShaped = distIndexMiddle > 0.05;

    // 2手势中，大拇指不应该和食指/中指捏在一起 (排除7)
    const isNotPinching = distThumbIndex > 0.08 && distThumbMiddle > 0.08;

    // 食指中指伸直，无名指小指弯曲，且呈V字形，且大拇指没有捏合
    return indexIsOpen && middleIsOpen && !ringIsOpen && !pinkyIsOpen && isVShaped && isNotPinching;
  }
}
