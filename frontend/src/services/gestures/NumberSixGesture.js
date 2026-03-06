import GestureStrategy from './GestureStrategy';

export default class NumberSixGesture extends GestureStrategy {
  getName() {
    return 'NUMBER_SIX';
  }

  check(landmarks) {
    // 中国手势 6：大拇指和小指伸开，其他手指闭合。
    const thumbIsOpen = this.isFingerOpen(landmarks, 4, 3); // 大拇指通常没有 PIP(3) 与手腕的比较... 使用标准检查或只是判断是否向外伸展
    // 大拇指的检查通常比较棘手。我们使用它与其他手指的距离或标准的伸展判断。
    // 对于大拇指，我们检查指尖是否远离手掌中心（相对于根部）。

    // 对大拇指使用标准的 isFingerOpen（使用节点 4 和 2？）不，大拇指有 4 个节点：1, 2, 3, 4。
    // isFingerOpen 使用指尖和第二关节。对于大拇指，指尖是 4，第二关节是 2 (MCP)。
    const thumbOpen = this.isFingerOpen(landmarks, 4, 2);
    const indexOpen = this.isFingerOpen(landmarks, 8, 6);
    const middleOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyOpen = this.isFingerOpen(landmarks, 20, 18);

    // 检查 6 和 Heart/OK 的冲突
    // Heart/OK: 拇指尖和食指尖靠近。
    // 6: 拇指伸直，食指弯曲握拳。拇指尖应该离食指尖挺远的。

    // 如果拇指尖 (4) 和食指尖 (8) 靠得太近，说明可能是比心或者OK，不是 6。
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    // 阈值：如果是 6，拇指翘起，食指扣住，距离应该较大。
    // 如果小于 0.08 (归一化距离)，说明在捏合。
    // 恢复正常阈值，因为我们现在有了双手指心检测，不再担心单手 6 和 双手 Heart 的混淆（用户会把两手并在一起）
    if (distThumbIndex < 0.06) {
      return false;
    }

    if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && pinkyOpen) {
      return true;
    }
    return false;
  }
}
