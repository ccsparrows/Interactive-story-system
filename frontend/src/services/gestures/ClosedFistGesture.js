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

    const indexIndex = 8;
    const indexPip = 6;

    // 拇指伸直检测 (ThumbUp check)
    // 如果拇指尖(4) 距离食指大关节(5) 太远，说明拇指翘起来了，或者伸出去了，不是紧握的拳头
    const thumbTip = landmarks[4];
    const indexMCP = landmarks[5];
    const distThumbTipToMCP = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y);

    // 阈值：如果是握拳，拇指是扣在食指/中指上面的，距离很近 (0.05-0.1)
    // 如果是 ThumbUp，距离很大 (>0.15)
    // 注意：需要确保前面已定义 thumbTip, indexMCP
    if (distThumbTipToMCP > 0.12) return false;

    // 检查食指、中指、无名指、小指
    const indexCurled = isCurled(8, 6);
    const middleCurled = isCurled(12, 10);
    const ringCurled = isCurled(16, 14);
    const pinkyCurled = isCurled(20, 18);

    if (!(indexCurled && middleCurled && ringCurled && pinkyCurled)) return false;

    // 增加 Heart 的反向排除。
    // 比心时，食指虽然弯曲，但并没有"死死地"压在手心。
    // 检查 Index PIP (6) 到 Thumb IP (3) 的距离。
    // 如果这个距离 比较大，说明可能是 Heart (有洞)。

    const indexPIP = landmarks[6];
    const thumbIP = landmarks[3];
    const distHole = Math.hypot(indexPIP.x - thumbIP.x, indexPIP.y - thumbIP.y);

    // 如果洞很大，肯定不是拳头
    // 阈值：需要调整
    if (distHole > 0.08) return false;

    // 增加 7 的反向排除
    // 7手势中，食指和中指的指尖是捏在一起的，并且向前伸出
    // 拳头中，指尖是紧贴手掌的
    const indexTip = landmarks[8];
    const distIndexTipToWrist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
    const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);

    // 如果食指指尖距离手腕较远，说明手指是伸出去的（比如7），而不是握紧的拳头
    if (distIndexTipToWrist > palmSize * 1.2) return false;

    return true;
  }
}
