import GestureStrategy from './GestureStrategy';

export default class ClosedFistGesture extends GestureStrategy {
  getName() {
    return 'CLOSED_FIST';
  }

  check(landmarks) {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9]; // 中指指根，作为手掌大小参考

    // 计算手掌参考尺度 (Wrist 到 Middle MCP 的距离平方)
    const palmSizeSq = (middleMcp.x - wrist.x) ** 2 + (middleMcp.y - wrist.y) ** 2;

    // 辅助函数：判断手指是否卷曲
    const isCurled = (tipIdx, pipIdx) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];

      const distTipSq = (tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2;
      const distPipSq = (pip.x - wrist.x) ** 2 + (pip.y - wrist.y) ** 2;

      // 判定条件 1: 指尖比 PIP 更靠近手腕 (严格卷曲)
      // 判定条件 2: 指尖距离手腕非常近 (相对于手掌大小)，防止 PIP 检测误差
      // 1.5 * 1.5 = 2.25 (放宽阈值)
      return distTipSq < distPipSq || distTipSq < palmSizeSq * 2.5;
    };

    // 检查食指、中指、无名指、小指
    const indexCurled = isCurled(8, 6);
    const middleCurled = isCurled(12, 10);
    const ringCurled = isCurled(16, 14);
    const pinkyCurled = isCurled(20, 18);

    // 只要四指卷曲，且拇指没有被前面的 ThumbUp 策略捕获（说明拇指不是明显伸直），
    // 我们就认为是握拳。
    return indexCurled && middleCurled && ringCurled && pinkyCurled;
  }
}
