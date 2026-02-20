const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  pageId: { type: Number, required: true },
  type: { type: String, default: 'interactive' }, // 页面类型: normal, interactive, math, count, word
  content: { type: String, required: true },
  expectedText: { type: String }, // Word学习页的单词内容
  image: { type: String },
  requiredGesture: { type: String }, // 可以为空，表示非交互页
  gestureHint: { type: String },
  animationTrigger: { type: String },
});

const StorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // 保持原有的 string id (如 story_001)
  title: { type: String, required: true },
  ageRating: { type: String, default: '3-6岁' }, // 适龄信息
  type: {
    type: String,
    // enum: ['interactive', 'non-interactive', 'learning'], // 放宽限制
    default: 'interactive',
  },
  subtype: { type: String }, // 学习类型子类 (count/word/math)
  cover: { type: String },
  pages: [PageSchema],
});

module.exports = mongoose.model('Story', StorySchema);
