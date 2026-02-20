const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config(); // 加载 .env 变量
const initialStories = require('./data/stories.json');

// 引入模型
const User = require('./models/User');
const Story = require('./models/Story');

const app = express();
const PORT = 5000;
const MONGODB_URI = 'mongodb://127.0.0.1:27018/interactive-story-system';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态资源服务：图片上传目录
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 连接 MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    initializeStories(); // 连接成功后检查并初始化数据
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));

// 初始化故事数据 (如果数据库为空)
const initializeStories = async () => {
  try {
    const count = await Story.countDocuments();
    if (count === 0) {
      console.log('No stories found. Initializing default stories...');
      await Story.insertMany(initialStories);
      console.log('Default stories initialized.');
    }
  } catch (error) {
    console.error('Error initializing stories:', error);
  }
};

// 注册
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) return res.status(400).json({ message: 'Missing fields' });

  try {
    // 检查用户名或邮箱是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username)
        return res.status(409).json({ message: 'Username already exists' });
      if (existingUser.email === email)
        return res.status(409).json({ message: 'Email already exists' });
    }

    const avatar = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${username}`;

    // 简单的管理员权限分配逻辑：如果用户名为 "admin"，则自动设为管理员
    const role = username === 'admin' ? 'admin' : 'user';

    const newUser = new User({
      username,
      password, // 建议后续添加 bcrypt 加密
      email,
      avatar,
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 登录
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // 支持用户名或邮箱登录
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 动态生成头像 (兼容旧数据)
    const avatar =
      user.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.username}`;

    // 强制赋予 admin 用户管理员权限 (修复旧数据问题)
    const role = user.username === 'admin' ? 'admin' : user.role || 'user';

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: avatar,
        role: role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 获取所有故事列表
app.get('/api/stories', async (req, res) => {
  try {
    // 使用 aggregation 高效获取所需数据
    const stories = await Story.aggregate([
      {
        $project: {
          id: 1,
          title: 1,
          type: 1,
          ageRating: { $ifNull: ['$ageRating', '3-6岁'] },
          cover: 1,
          pageCount: { $size: { $ifNull: ['$pages', []] } },
          // 获取第一张有图片的页面的图片作为备选封面
          // 这里简化为获取前几页的图片，然后在 JS 中处理
          pages: {
            $map: {
              input: { $slice: [{ $ifNull: ['$pages', []] }, 5] },
              as: 'p',
              in: { image: '$$p.image' },
            },
          },
        },
      },
    ]);

    const storyList = stories.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      ageRating: s.ageRating,
      cover: s.cover,
      pageCount: s.pageCount,
      firstImage: s.pages ? s.pages.find((p) => p.image)?.image : null,
    }));

    // --- 修改开始：合并本地 JSON 数据作为测试数据 ---
    // 为了防止 ID 冲突，只添加数据库中不存在的故事
    const dbIds = new Set(storyList.map((s) => s.id));
    const localStories = initialStories
      .filter((s) => !dbIds.has(s.id))
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        ageRating: s.ageRating || '3-6岁',
        cover: s.cover,
        pageCount: s.pages ? s.pages.length : 0,
        firstImage: s.pages ? s.pages.find((p) => p.image)?.image : null,
      }));

    res.json([...storyList, ...localStories]);
    // --- 修改结束 ---
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Error fetching stories' });
  }
});

// 获取特定故事详情
app.get('/api/stories/:id', async (req, res) => {
  try {
    let story = await Story.findOne({ id: req.params.id });

    // --- 修改开始：如果数据库没找到，尝试从本地 JSON 找 ---
    if (!story) {
      story = initialStories.find((s) => s.id === req.params.id);
    }
    // --- 修改结束 ---

    if (story) {
      res.json(story);
    } else {
      res.status(404).json({ message: 'Story not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching story details' });
  }
});

// 添加新故事 (管理员)
app.post('/api/stories', async (req, res) => {
  try {
    const { title, cover, pages, ageRating, type, subtype } = req.body;

    // 简单的 ID 生成策略
    const id = `story_${Date.now()}`;

    // 优先使用前端传来的 type，如果没有则自动判断
    let finalType = type;
    let finalSubtype = subtype;

    if (!finalType || !finalSubtype) {
      // 尝试自动推断 Learning 类型（根据第一页类型）
      const firstPage = pages && pages.length > 0 ? pages[0] : null;
      if (firstPage) {
        if (firstPage.type === 'word') {
          finalType = 'learning';
          finalSubtype = 'word';
        } else if (firstPage.type === 'math') {
          finalType = 'learning';
          finalSubtype = 'math';
        } else if (firstPage.type === 'count') {
          finalType = 'learning';
          finalSubtype = 'count';
        }
      }

      if (!finalType) {
        finalType =
          pages && pages.some((p) => p.requiredGesture && p.requiredGesture.trim() !== '')
            ? 'interactive'
            : 'non-interactive';
      }
    }

    const newStory = new Story({
      id,
      title,
      type: finalType,
      subtype: finalSubtype,
      ageRating: ageRating || '3-6岁',
      cover,
      pages,
    });

    await newStory.save();
    res.status(201).json({ message: 'Story created successfully', story: newStory });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: 'Error creating story', error: error.message });
  }
});

// 更新故事 (管理员)
app.put('/api/stories/:id', async (req, res) => {
  try {
    const { title, cover, pages, ageRating, type, subtype } = req.body;

    // 优先使用前端传来的 type，如果没有则自动判断
    let finalType = type;
    let finalSubtype = subtype;

    if (!finalType || !finalSubtype) {
      // 尝试自动推断 Learning 类型（根据第一页类型）
      const firstPage = pages && pages.length > 0 ? pages[0] : null;
      if (firstPage) {
        if (firstPage.type === 'word') {
          finalType = 'learning';
          finalSubtype = 'word';
        } else if (firstPage.type === 'math') {
          finalType = 'learning';
          finalSubtype = 'math';
        } else if (firstPage.type === 'count') {
          finalType = 'learning';
          finalSubtype = 'count';
        }
      }

      // 如果还是没有推断出 Learning，则回退到原来的逻辑
      if (!finalType) {
        finalType =
          pages && pages.some((p) => p.requiredGesture && p.requiredGesture.trim() !== '')
            ? 'interactive'
            : 'non-interactive';
      }
    }

    const updatedStory = await Story.findOneAndUpdate(
      { id: req.params.id },
      { title, cover, pages, ageRating, type: finalType, subtype: finalSubtype },
      { new: true }
    );
    if (updatedStory) {
      res.json({ message: 'Story updated successfully', story: updatedStory });
    } else {
      res.status(404).json({ message: 'Story not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating story', error: error.message });
  }
});

// 删除故事 (管理员)
app.delete('/api/stories/:id', async (req, res) => {
  try {
    const result = await Story.findOneAndDelete({ id: req.params.id });
    if (result) {
      res.json({ message: 'Story deleted successfully' });
    } else {
      res.status(404).json({ message: 'Story not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting story', error: error.message });
  }
});

// 优化版：异步下载图片 (解决前端等待时间过长问题)
app.post('/api/save-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ message: 'imageUrl is required' });

  // 如果已经是本地链接或非临时链接，直接返回
  if (imageUrl.includes('localhost') || imageUrl.startsWith('/')) {
    return res.json({ url: imageUrl });
  }

  // 1. 预先生成文件名和路径
  const filename = `ai_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const filePath = path.join(uploadsDir, filename);
  const localUrl = `http://localhost:${PORT}/uploads/${filename}`;

  // 2. 立即创建占位符文件 (避免前端立即请求时 404)
  // 如果有 placeholder_loading.svg 则复制，否则创建一个空的 0kb 文件或简单的文本
  const placeholderPath = path.join(uploadsDir, 'placeholder_loading.svg');
  if (fs.existsSync(placeholderPath)) {
    try {
      fs.copyFileSync(placeholderPath, filePath);
    } catch (e) {
      console.error('Error copying placeholder', e);
    }
  } else {
    // 创建一个空的占位文件，前端显示可能裂图但不会404
    fs.writeFileSync(filePath, '');
  }

  // 3. 立即响应给前端 (极速体验)
  res.json({ url: localUrl });

  // 4. 后台异步执行下载任务 (Fire and Forget)
  (async () => {
    try {
      console.log(`[Background] Starting download for: ${filename}`);
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
      });

      // 使用临时文件写入，下载完成后再重命名覆盖，防止读取到半张图
      const tempFilePath = filePath + '.tmp';
      const writer = fs.createWriteStream(tempFilePath);

      response.data.pipe(writer);

      writer.on('finish', () => {
        // 下载完成，重命名覆盖占位图
        fs.rename(tempFilePath, filePath, (err) => {
          if (err) console.error(`[Background] Rename error for ${filename}:`, err);
          else console.log(`[Background] Download success: ${filename}`);
        });
      });

      writer.on('error', (err) => {
        console.error(`[Background] Write error for ${filename}:`, err);
        // 如果下载失败，删除临时文件，保留占位图或者删除占位图让前端404
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      });
    } catch (error) {
      console.error(`[Background] Download failed for ${filename}:`, error.message);
      // 可选：下载失败时删除占位图，让用户看到图片裂开而不是一直 loading
      // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  })();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
