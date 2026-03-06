export default class GestureStrategy {
  constructor() {
    if (this.constructor === GestureStrategy) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  getName() {
    throw new Error("Method 'getName()' must be implemented.");
  }

  check(landmarks, context) {
    throw new Error("Method 'check()' must be implemented.");
  }

  /**
   * 辅助函数：检查手指是否伸直（张开）
   * 逻辑是比较指尖到手腕的距离与第二关节（PIP）到手腕的距离。
   * 如果指尖比 PIP 离手腕更远，则认为手指是伸直的。
   *
   * @param {Array} landmarks - 手部关键点数组
   * @param {number} tipIndex - 指尖的索引（例如，食指是 8）
   * @param {number} pipIndex - 第二关节（PIP）的索引（例如，食指是 6）
   * @returns {boolean} - 如果手指伸直则返回 true
   */
  isFingerOpen(landmarks, tipIndex, pipIndex) {
    const wrist = landmarks[0];
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];

    const distTip = Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2);
    const distPip = Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2);

    return distTip > distPip;
  }
}
