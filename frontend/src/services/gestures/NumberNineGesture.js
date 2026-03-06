import GestureStrategy from './GestureStrategy';

export default class NumberNineGesture extends GestureStrategy {
  getName() {
    return 'NUMBER_NINE';
  }

  check(landmarks) {
    // 中国手势 9：食指弯曲成钩状，其他手指闭合。
    // 钩状特征：食指第二关节 (PIP) 伸出（远离手腕），但指尖弯曲（靠近手腕/手掌）。
    // 拳头/10：所有手指弯曲（PIP 相对靠近手腕/指关节）。

    const wrist = landmarks[0];

    // 检查其他手指是否闭合
    const middleOpen = this.isFingerOpen(landmarks, 12, 10);
    const ringOpen = this.isFingerOpen(landmarks, 16, 14);
    const pinkyOpen = this.isFingerOpen(landmarks, 20, 18);
    // 明确确保大拇指没有伸开（避免与 8 混淆）
    const thumbOpen = this.isFingerOpen(landmarks, 4, 3);

    if (middleOpen || ringOpen || pinkyOpen || thumbOpen) return false;

    // 检查食指是否呈钩状
    // 1. 指尖弯曲（未伸开）
    // 放宽检查：有时钩子“稍微”张开，但与 1 明显不同。
    // 但逻辑上，isFingerOpen=true 意味着是 1。
    // 所以对于 9，我们必须有 isFingerOpen=false 或特殊的覆盖逻辑。
    // 目前坚持使用 !indexOpen，但要确保“钩状”特征。
    const indexOpen = this.isFingerOpen(landmarks, 8, 6);
    if (indexOpen) return false;

    // 2. PIP (6) 必须突出（远离手腕延伸），这是“钩状”特有的
    // 在拳头中，PIP 也有一定程度的延伸，但通常与其他手指对齐。
    // 在钩状手势中，食指非常突出。

    const indexPIP = landmarks[6];
    const middlePIP = landmarks[10];

    const distIndexPIP = Math.hypot(indexPIP.x - wrist.x, indexPIP.y - wrist.y);
    const distMiddlePIP = Math.hypot(middlePIP.x - wrist.x, middlePIP.y - wrist.y);

    // 增加对 7 的反向排除
    // 在 7 中，大拇指、食指、中指指尖是捏在一起的
    // 在 9 中，食指是弯曲的钩子，大拇指通常贴在食指侧面或下方，但指尖不应该和食指指尖紧紧捏合
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    // 参考 7 的 touchThreshold (0.15)，如果距离太近，说明可能是 7
    // 9 的食指指尖和拇指指尖应该有一定的距离
    // 稍微放宽这个阈值，因为做 9 的时候大拇指可能会靠得比较近
    if (distThumbIndex < 0.12) {
      return false;
    }

    // 如果食指 PIP 明显比中指 PIP 伸出得更远。
    // 稍微降低阈值，使 9 更容易触发，并与拳头区分开来。
    if (distIndexPIP > distMiddlePIP * 1.1) {
      return true;
    }

    return false;
  }
}
