const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  pageId: { type: Number, required: true },
  content: { type: String, required: true },
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
    enum: ['interactive', 'non-interactive'],
    default: 'interactive',
  },
  cover: { type: String },
  pages: [PageSchema],
});

module.exports = mongoose.model('Story', StorySchema);
