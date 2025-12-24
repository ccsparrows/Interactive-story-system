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

    // 食指中指伸直，无名指小指弯曲
    return indexIsOpen && middleIsOpen && !ringIsOpen && !pinkyIsOpen;
  }
}
