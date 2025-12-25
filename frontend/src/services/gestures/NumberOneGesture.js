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

    // 食指伸直，其他三指弯曲
    return indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen;
  }
}
