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

    // 四指伸直 (拇指不强制要求，因为有时候张开手掌拇指可能不完全直立)
    return indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen;
  }
}
