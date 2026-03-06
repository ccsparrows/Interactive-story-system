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
    // 增加对食指的额外检查，防止 9 (Hook) 被误判为点赞
    // 9 的时候，食指虽然 indexCurled 可能为 true (Tip lower than PIP)，但 PIP 是突出的
    // 点赞的时候，食指完全卷曲，PIP 并不突出 (靠近掌心)

    // 如果 indexCurled=true, 说明 Tip 比 PIP 更靠近 Wrist。这是成立的。
    // 但是 9 的时候，PIP 离 Wrist 很远。
    // 点赞的时候，PIP 离 Wrist 较近。

    if (thumbIsOpen && indexCurled && middleCurled && ringCurled && pinkyCurled) {
      const indexPIP = landmarks[6];
      const middlePIP = landmarks[10];
      const wrist = landmarks[0];

      const distIndexPIP = Math.hypot(indexPIP.x - wrist.x, indexPIP.y - wrist.y);
      const distMiddlePIP = Math.hypot(middlePIP.x - wrist.x, middlePIP.y - wrist.y);

      // 如果食指关节凸出太多，可能是 9
      if (distIndexPIP > distMiddlePIP * 1.1) {
        return false;
      }

      return true;
    }

    return false;
  }
}
