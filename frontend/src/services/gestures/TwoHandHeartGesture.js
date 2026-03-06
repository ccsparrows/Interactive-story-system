import GestureStrategy from './GestureStrategy';

export default class TwoHandHeartGesture extends GestureStrategy {
  getName() {
    return 'HEART';
  }

  // 这个 check 方法只接收一只手的关键点，所以它本身无法检测双手手势。
  // 然而，我们可以用它来检测单手的“半心”形状，
  // 然后由 Service 来协调两只手是否构成一个心形。
  // 但是，通常最好直接在 Service 中处理双手手势。
  check(landmarks) {
    return false;
  }

  static checkTwoHanded(landmarks1, landmarks2) {
    // 检查两只手是否构成心形
    // 1. 左右手的食指尖 (Index Tip, 8) 接触
    // 2. 左右手的拇指尖 (Thumb Tip, 4) 接触
    // 3. 手指通常是弯曲的 (C-shape)

    // 假设 landmarks1 是左手，landmarks2 是右手（或者反过来，MediaPipe 不一定保证顺序）
    // 我们只关心坐标距离

    const indexTip1 = landmarks1[8];
    const thumbTip1 = landmarks1[4];
    const indexTip2 = landmarks2[8];
    const thumbTip2 = landmarks2[4];

    // 计算 指尖接触距离
    const distIndexTips = Math.hypot(indexTip1.x - indexTip2.x, indexTip1.y - indexTip2.y);
    const distThumbTips = Math.hypot(thumbTip1.x - thumbTip2.x, thumbTip1.y - thumbTip2.y);

    // 阈值：两手接触
    // 0.1 左右（待定）
    const isTouching = distIndexTips < 0.1 && distThumbTips < 0.1;

    if (!isTouching) return false;

    // 还可以检查食指和拇指的形态，确保不是简单的合并
    // 心形通常意味着 Index PIP (6) 是向上的
    // 但对于简化版，只要指尖接触即可

    return true;
  }
}
