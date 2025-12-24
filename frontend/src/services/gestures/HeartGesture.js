import GestureStrategy from './GestureStrategy';

export default class HeartGesture extends GestureStrategy {
  getName() {
    return 'HEART';
  }

  check(landmarks, context) {
    // 需要两只手
    if (!context.multiHandLandmarks || context.multiHandLandmarks.length < 2) {
      return false;
    }

    const hand1 = context.multiHandLandmarks[0];
    const hand2 = context.multiHandLandmarks[1];

    // 1. 区分左右手 (根据手腕 x 坐标，屏幕左侧为小)
    const leftHand = hand1[0].x < hand2[0].x ? hand1 : hand2;
    const rightHand = hand1[0].x < hand2[0].x ? hand2 : hand1;

    // 2. 检查指尖接触情况
    // 拇指指尖 (4) 距离
    const thumbDist = Math.hypot(leftHand[4].x - rightHand[4].x, leftHand[4].y - rightHand[4].y);

    // 食指指尖 (8) 距离
    const indexDist = Math.hypot(leftHand[8].x - rightHand[8].x, leftHand[8].y - rightHand[8].y);

    // 3. 检查垂直方向关系 (食指应该在拇指上方)
    // Y轴向下为正，所以上方意味着 y 值更小
    const leftIndexUp = leftHand[8].y < leftHand[4].y;
    const rightIndexUp = rightHand[8].y < rightHand[4].y;

    // 4. 阈值判定 (归一化坐标)
    const TOUCH_THRESHOLD = 0.15;

    return (
      thumbDist < TOUCH_THRESHOLD && indexDist < TOUCH_THRESHOLD && leftIndexUp && rightIndexUp
    );
  }
}
