import GestureStrategy from './GestureStrategy';

export default class ThumbUpGesture extends GestureStrategy {
  getName() {
    return 'THUMB_UP';
  }

  check(landmarks) {
    const wrist = landmarks[0];
    // ThumbUp 需要更严格的判断，避免将张开的手掌误判为点赞
    // 移除宽松的 palmSizeSq * 2.5 判断，只保留严格的卷曲判断

    const isCurled = (tipIdx, pipIdx) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];
      const distTipSq = (tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2;
      const distPipSq = (pip.x - wrist.x) ** 2 + (pip.y - wrist.y) ** 2;
      // 严格判定：指尖必须比 PIP 关节更靠近手腕
      return distTipSq < distPipSq;
    };

    const indexCurled = isCurled(8, 6);
    const middleCurled = isCurled(12, 10);
    const ringCurled = isCurled(16, 14);
    const pinkyCurled = isCurled(20, 18);

    // 拇指判断：依然使用 Y 轴判断是否向上伸直
    const thumbIsOpen = this.isFingerOpen(landmarks, 4, 3);

    // 拇指伸直，其他弯曲
    return thumbIsOpen && indexCurled && middleCurled && ringCurled && pinkyCurled;
  }
}
