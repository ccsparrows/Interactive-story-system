import GestureStrategy from './GestureStrategy';

export default class NumberSevenGesture extends GestureStrategy {
  getName() {
    return 'NUMBER_SEVEN';
  }

  check(landmarks) {
    // 中国手势 7：大拇指、食指、中指指尖捏在一起。无名指和小指闭合。
    // 或者有时只是大拇指、食指、中指伸出，但指尖靠得很近。

    const ringOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyOpen = this.isFingerOpen(landmarks, 20, 18);

    // 无名指和小指必须闭合
    if (ringOpen || pinkyOpen) return false;

    // 检查大拇指(4)、食指(8)、中指(12)指尖之间的距离
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const wrist = landmarks[0];

    // 防止握拳被误判为 7
    // 在 7 中，手指虽然捏合，但是是伸出去的。指尖距离手腕(Wrist) 较远。
    // 在握拳中，指尖距离手腕很近。

    const distIndexTipToWrist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
    const middleMCP = landmarks[9];
    const palmSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);

    // 如果指尖离手腕太近，说明是缩回来的（拳头/10）
    // 稍微放宽这个阈值，因为有些人的7捏得比较紧
    if (distIndexTipToWrist < palmSize * 1.2) {
      return false;
    }

    const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const distThumbMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
    const distIndexMiddle = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);

    // 捏合的阈值
    // 放宽捏合的阈值，因为摄像头视角或手指粗细会导致距离计算偏大
    const touchThreshold = 0.15;

    if (
      distThumbIndex < touchThreshold &&
      distThumbMiddle < touchThreshold &&
      distIndexMiddle < touchThreshold
    ) {
      // 额外检查：确保食指和中指的第二关节(PIP)是伸出的，而不是像拳头一样完全卷曲
      const indexPIP = landmarks[6];
      const distIndexPIPToWrist = Math.hypot(indexPIP.x - wrist.x, indexPIP.y - wrist.y);

      // 增加对 9 的反向排除
      // 在 9 中，食指是弯曲的钩子，指尖距离手腕较近，而 PIP 距离手腕较远
      // 在 7 中，食指是向前伸出的，指尖距离手腕应该比 PIP 距离手腕更远，或者差不多远
      // 如果指尖比 PIP 离手腕近很多，说明手指是弯曲的（像 9），而不是伸直捏合的（像 7）
      if (distIndexTipToWrist < distIndexPIPToWrist * 0.9) {
        return false;
      }

      // 7手势中，手指虽然捏合，但整体是向前伸的，所以PIP距离手腕应该比较远
      // 降低阈值，因为有些人的手指比较短或者弯曲程度不同
      if (distIndexPIPToWrist > palmSize * 1.2) {
        return true;
      }
    }

    return false;
  }
}
