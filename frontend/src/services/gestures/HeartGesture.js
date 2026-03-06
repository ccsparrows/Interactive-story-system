import GestureStrategy from './GestureStrategy';

export default class HeartGesture extends GestureStrategy {
  constructor() {
    super();
  }

  getName() {
    return 'HEART';
  }

  check(landmarks) {
    // 拇指(4)和食指(8)必须弯曲且接触形成心形上部
    // 关键点：
    // 4 (Thumb Tip) 和 8 (Index Tip) 接近

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    // 使用距离平方避免开方，提高性能? 不过这里只算一次
    const distanceTip = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );

    // 拇指和食指尖距离必须很近
    // 阈值需要调试，暂定 0.05 (归一化坐标系)
    // 如果是比心，通常指尖是贴在一起的
    const isTipsClose = distanceTip < 0.08;

    if (!isTipsClose) return false;

    // 关键区别：
    // 在握拳 (Fist) 中，食指也是弯曲的，指尖可能碰到手掌或拇指根部。
    // 在比心 (Heart) 中，食指的第一关节 (PIP, 6) 应该是伸展的，或者至少食指整体呈现"C"形。
    // 而握拳时，食指是完全卷曲的，PIP (6) 会比较低 / 靠近手掌。

    // 检查食指形态：比心时，食指通常是向上拱起的
    // 比较食指 PIP (6) 和 MCP (5) 的位置
    // 在正向比心时，PIP 应该比 MCP 更"高" (y轴更小) 或者更"外"

    // 更稳健的方法：除了检查其他手指弯曲，还需要检查食指是否"不够弯" (即不是握拳)
    // 握拳: Tip 到 Wrist 距离 < PIP 到 Wrist 距离
    // 比心: Tip 和 PIP 到 Wrist 距离可能差不多，或者构成一个圈

    // 增加检查：食指根部 (MCP, 5) 到 食指指尖 (Tip, 8) 的距离
    // 握拳时，这个距离很短。
    // 比心时，这个距离较长 (因为构成了半圆)。

    const indexMCP = landmarks[5];
    const distIndexMcpToTip = Math.hypot(indexTip.x - indexMCP.x, indexTip.y - indexMCP.y);

    // 如果这个距离太短，说明食指卷曲得很厉害 -> 可能是拳头
    // 阈值：需要实验。比心时食指是弯的，但不是死折。
    // 调低阈值：只要不是完全折叠 (0.03?)
    if (distIndexMcpToTip < 0.04) return false;

    // 检查拇指和食指是不是真的“扣”在一起了
    // 区别：
    // Heart: 拇指和食指构成一个圈，中间是空的。
    // Fist: 压实的。

    // 如果中间没有空洞 (Thumb IP and Index PIP too close?)
    const indexPIP = landmarks[6];
    const thumbIP = landmarks[3];
    // Thumb IP (3) vs Index PIP (6)
    const distHole = Math.hypot(indexPIP.x - thumbIP.x, indexPIP.y - thumbIP.y);

    // 如果距离太近，说明压实了 -> 拳头
    // 调低阈值，允许较小的洞也算心
    if (distHole < 0.025) return false;

    // 检查其他手指是否弯曲 (Middle, Ring, Pinky)
    // 9, 13, 17 是根部 (MCP)
    // 12, 16, 20 是指尖
    // 这里使用 isFingerOpen 检查，如果 open 则不是 Heart (因为需要握着对应部分)
    // 注意：isFingerOpen 返回 true 表示伸直。我们需要它们是弯曲的 (false)

    // 中指
    const isMiddleOpen = this.isFingerOpen(landmarks, 12, 10);
    // 无名指
    const isRingOpen = this.isFingerOpen(landmarks, 16, 14);
    // 小指
    const isPinkyOpen = this.isFingerOpen(landmarks, 20, 18);

    // 如果任何一个手指伸直了，就不是标准比心
    if (isMiddleOpen || isRingOpen || isPinkyOpen) {
      return false;
    }

    return true;
  }
}
