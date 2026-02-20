import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Tooltip,
  message,
  Steps,
  Spin,
  Result,
  Popover,
  Radio,
  Row,
  Col,
} from 'antd';
import {
  RocketOutlined,
  BulbOutlined,
  PictureOutlined,
  EditOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
// const { Step } = Steps;

const ASPECT_RATIOS = [
  { label: '1:1 (正方形)', value: '1024x1024' },
  { label: '4:3 (横向)', value: '1152x896' },
  { label: '3:4 (竖向)', value: '896x1152' },
  { label: '16:9 (宽屏)', value: '1344x768' },
];

const ART_STYLES = [
  { label: '儿童绘本 (默认)', value: 'children book style, cute, colorful' },
  { label: '3D 渲染', value: '3d blender render, cute character, isometric' },
  { label: '二次元动漫', value: 'anime style, vibrant colors, studio ghibli inspired' },
  { label: '水彩画', value: 'watercolor painting, artistic, soft strokes' },
  { label: '彩色铅笔', value: 'colored pencil drawing, hand drawn sketch' },
  { label: '油画风格', value: 'oil painting, textured, impressionism' },
  { label: '赛博朋克', value: 'cyberpunk, neon lights, futuristic' },
];

const AiStoryGenerator = ({ onStoryGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState({}); // Track loading state per page
  const [coverLoading, setCoverLoading] = useState(false); // Track cover loading state
  const [imageSettings, setImageSettings] = useState({}); // Track custom settings per page
  const [coverSettings, setCoverSettings] = useState({}); // Track custom settings for cover
  const [step, setStep] = useState(0);
  const [generatedStory, setGeneratedStory] = useState(null);
  const [form] = Form.useForm();

  // ==================================================================================
  // AI 配置区域 (实际接入请替换以下 Const)
  // 建议在生产环境中将 API Key 移至后端或环境变量
  // ==================================================================================

  // 硅基流动 (SiliconFlow) 统一配置
  // 包含 DeepSeek V3 (文本) 和 Flux (图片)
  const SILICONFLOW_KEY = 'sk-bihxaqopnxsmbemstrbfirywirddkjtryygpmwjiambozpgb';

  const TEXT_AI_URL = 'https://api.siliconflow.cn/v1/chat/completions';
  const TEXT_AI_KEY = SILICONFLOW_KEY;
  const TEXT_AI_MODEL = 'deepseek-ai/DeepSeek-V3';

  const IMAGE_AI_URL = 'https://api.siliconflow.cn/v1/images/generations';
  const IMAGE_AI_KEY = SILICONFLOW_KEY;
  const IMAGE_AI_MODEL = 'Kwai-Kolors/Kolors';
  // ==================================================================================

  // 1. 调用 AI 生成故事文本 (真实 API 调用)
  const handleGenerateStory = async (values) => {
    setLoading(true);
    message.loading({ content: 'AI 正在构思故事大纲...', key: 'ai_gen' });

    try {
      // 构建提示词
      let strictPageTypeInstruction = '';
      let subtypeInstruction = '';

      if (values.type === 'learning') {
        if (values.subtype === 'word') {
          subtypeInstruction = '这是一个【单词学习】故事。';
          strictPageTypeInstruction =
            '所有页面的 type 必须严格为 "word"。每页包含一个英文单词(expectedText)和中文释义(gestureHint)。不需要 requiredGesture (null)。';
        } else if (values.subtype === 'count') {
          subtypeInstruction = '这是一个【趣味数数】故事。';
          strictPageTypeInstruction =
            '所有页面的 type 必须严格为 "count"。每页包含数数问题、对应的数字手势(requiredGesture)和提示语(gestureHint)。';
        } else if (values.subtype === 'math') {
          subtypeInstruction = '这是一个【简单算术】故事。';
          strictPageTypeInstruction =
            '所有页面的 type 必须严格为 "math"。content 必须是算式(如 "1 + 1 = ?")。不需要 image (空字符串)。必须包含正确答案对应的数字手势(requiredGesture)。';
        }
      } else if (values.type === 'interactive') {
        strictPageTypeInstruction =
          '所有页面的 type 必须严格为 "interactive"。必须包含 requiredGesture (交互手势)。';
      } else {
        strictPageTypeInstruction =
          '所有页面的 type 必须严格为 "normal"。requiredGesture 必须为 null。';
      }

      const userPrompt = `
          请创建一个关于 "${values.theme}" 的儿童故事。
          主类型: ${values.type}
          ${subtypeInstruction}
          面向年龄: ${values.age}
          额外要求: ${values.prompt || '无'}
          
          ${strictPageTypeInstruction}

          请必须返回严格的 JSON 格式，结构如下:
          {
            "title": "故事标题",
            "type": "${values.type}",
            "subtype": "${values.subtype || ''}",
            "ageRating": "${values.age}",
            "pages": [
              {
                "pageId": 1,
                "type": "页类型，必须严格遵守上述规则(word/math/count/interactive/normal)",
                "content": "剧情内容。word类型:英文单词; math类型:算式; 其他:故事文本",
                "expectedText": "仅 word 类型必填(英文单词); 其他类型留空",
                "imagePrompt": "word/count/interactive/normal 类型必填提示词; math 类型留空",
                "requiredGesture": "交互动作: THUMB_UP / OPEN_PALM (表示5) / WAVE / OK (表示3) / VICTORY (表示2) / CLOSED_FIST / HEART / NUMBER_ONE / NUMBER_FOUR。注意：严禁使用 NUMBER_TWO 或 NUMBER_THREE，必须使用 VICTORY 和 OK。",
                "gestureHint": "word类型:中文释义; math/count/interactive类型:手势提示"
              }
            ]
          }
        `;

      // 发起请求 (如果 TEXT_AI_KEY 未配置，则仍使用 Mock 以防报错)
      if (TEXT_AI_KEY.includes('xxxx')) {
        console.warn('API Key 未配置，将使用 Mock 数据演示');
        await new Promise((r) => setTimeout(r, 2000)); // 模拟延迟
        throw new Error('MOCK_MODE');
      }

      const response = await fetch(TEXT_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEXT_AI_KEY}`,
        },
        body: JSON.stringify({
          model: TEXT_AI_MODEL,
          messages: [
            { role: 'system', content: '你是一个专业的儿童故事创作者，请输出 JSON 格式。' },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      // 解析 AI 返回的 JSON 内容
      const aiContent =
        typeof data.choices[0].message.content === 'string'
          ? JSON.parse(data.choices[0].message.content)
          : data.choices[0].message.content;

      // 补全一些可能缺失的字段
      aiContent.cover = 'https://placehold.co/400x300?text=AI+Cover';

      // 修复 AI 可能产生的幻觉手势 (Normalization)
      if (aiContent.pages && Array.isArray(aiContent.pages)) {
        aiContent.pages.forEach((p) => {
          if (p.requiredGesture === 'NUMBER_TWO') p.requiredGesture = 'VICTORY';
          if (p.requiredGesture === 'NUMBER_THREE') p.requiredGesture = 'OK';
          if (p.requiredGesture === 'NUMBER_FIVE') p.requiredGesture = 'OPEN_PALM';
        });
      }

      setGeneratedStory(aiContent);
      message.success({ content: '故事大纲已生成！', key: 'ai_gen' });
      setStep(1);
    } catch (error) {
      if (error.message === 'MOCK_MODE') {
        // --- Fallback 到之前的 Mock 数据 (仅用于演示/开发) ---
        const mockAiResponse = {
          title: `${values.theme}大冒险 (演示)`,
          type: values.type,
          ageRating: values.age,
          cover: 'https://placehold.co/400x300?text=Cover',
          pages: [
            {
              pageId: 1,
              type: 'interactive',
              content: `这是一个关于${values.theme}的奇幻开始...`,
              imagePrompt: `${values.theme}, fantasy children book illustration`,
              requiredGesture: 'THUMB_UP',
              gestureHint: '竖起大拇指出发！',
            },
            {
              pageId: 2,
              type: 'interactive',
              content: '遇到了新的挑战！',
              imagePrompt: `adventure scene, ${values.theme}`,
              requiredGesture: 'WAVE',
              gestureHint: '挥挥手解决困难！',
            },
          ],
        };
        if (values.type === 'learning') {
          // Mock data handling for specific subtypes
          if (values.subtype === 'count') {
            mockAiResponse.subtype = 'count';
            mockAiResponse.pages = [
              {
                pageId: 1,
                type: 'count', // 严格对应 PAGE_TYPES.COUNT
                content: '图中有几只小鸭子？',
                requiredGesture: 'OK',
                gestureHint: '3只，做OK手势',
                imagePrompt: '3 cute yellow ducks swimming',
              },
              {
                pageId: 2,
                type: 'count',
                content: '有几个红苹果？',
                requiredGesture: 'VICTORY',
                gestureHint: '2个，做耶的手势',
                imagePrompt: '2 red apples on tree',
              },
            ];
          } else if (values.subtype === 'word') {
            mockAiResponse.subtype = 'word';
            mockAiResponse.pages = [
              {
                pageId: 1,
                type: 'word', // 严格对应 PAGE_TYPES.WORD
                content: 'Apple',
                expectedText: 'apple',
                requiredGesture: null,
                gestureHint: '苹果',
                imagePrompt: 'a red apple',
              },
              {
                pageId: 2,
                type: 'word',
                content: 'Banana',
                expectedText: 'banana',
                requiredGesture: null,
                gestureHint: '香蕉',
                imagePrompt: 'a yellow banana',
              },
            ];
          } else if (values.subtype === 'math') {
            mockAiResponse.subtype = 'math';
            mockAiResponse.pages = [
              {
                pageId: 1,
                type: 'math', // 严格对应 PAGE_TYPES.MATH
                content: '1 + 1 = ?',
                requiredGesture: 'VICTORY', // 2
                gestureHint: '答案是2',
                imagePrompt: '', // math page usually no background image or custom
              },
              {
                pageId: 2,
                type: 'math',
                content: '2 + 1 = ?',
                requiredGesture: 'OK', // 3
                gestureHint: '答案是3',
                imagePrompt: '',
              },
            ];
          }
        }

        // Mock 成功也要停止 timer
        setGeneratedStory(mockAiResponse);
        setStep(1);
        message.success({
          content: '演示模式：已生成 Mock 大纲 (请配置真实 Key)',
          key: 'ai_gen',
        });
        // -----------------------------------------------------
      } else {
        console.error(error);
        message.error({ content: 'AI 生成失败: ' + error.message, key: 'ai_gen' });
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. 调用 AI 生成图片 (真实 API 调用)
  const handleGenerateImage = async (pageIndex) => {
    setImageLoading((prev) => ({ ...prev, [pageIndex]: true }));
    message.loading({ content: `正在绘图 (Page ${pageIndex + 1})...`, key: 'img_gen' });

    try {
      const settings = imageSettings[pageIndex] || {};
      const size = settings.size || '1024x1024';
      const style = settings.style || 'children book style, cute, colorful';
      const promptText = settings.prompt || generatedStory.pages[pageIndex].imagePrompt;

      const fullPrompt = `${promptText}, ${style}, high quality`;

      // 发起请求 (如果 KEY 未配置，则 Mock)
      if (IMAGE_AI_KEY.includes('xxxx')) {
        await new Promise((r) => setTimeout(r, 1500));
        throw new Error('MOCK_MODE');
      }

      const response = await fetch(IMAGE_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${IMAGE_AI_KEY}`,
        },
        body: JSON.stringify({
          model: IMAGE_AI_MODEL,
          prompt: fullPrompt,
          image_size: size,
          num_inference_steps: 20, // 针对快速模型
          seed: Math.floor(Math.random() * 1000000), // Random seed
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      // 假设返回结构 { data: [{ url: "..." }] }
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) throw new Error('Image URL not found in response');

      // 更新状态 (仅使用临时链接预览，稍后在确认时统一转存)
      const newStory = { ...generatedStory };
      newStory.pages[pageIndex].image = imageUrl;

      setGeneratedStory(newStory);
      message.success({ content: '插图生成完成！', key: 'img_gen' });
    } catch (error) {
      if (error.message === 'MOCK_MODE') {
        const newStory = { ...generatedStory };
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        const settings = imageSettings[pageIndex] || {};
        const size = settings.size || '1024x1024';
        newStory.pages[pageIndex].image =
          `https://placehold.co/${size.replace('x', 'x')}/${randomColor}/ffffff?text=AI+Result`;
        setGeneratedStory(newStory);
        message.success({ content: '演示模式: Mock 图片已生成', key: 'img_gen' });
      } else {
        message.error({ content: '绘图失败: ' + error.message, key: 'img_gen' });
      }
    } finally {
      setImageLoading((prev) => ({ ...prev, [pageIndex]: false }));
    }
  };

  // 生成封面逻辑
  const handleGenerateCover = async () => {
    setCoverLoading(true);
    message.loading({ content: 'AI 正在绘制封面...', key: 'cover_gen' });

    try {
      const settings = coverSettings;
      const size = settings.size || '1024x1024';
      const style = settings.style || 'children book style, cute, colorful';
      const defaultPrompt = `Children's book cover, title "${generatedStory.title}", theme: ${generatedStory.theme || 'Adventure'}. cute, colorful, high quality, text title embedded design`;
      const promptText = settings.prompt || defaultPrompt;

      const fullPrompt = `${promptText}, ${style}, high quality`;

      if (IMAGE_AI_KEY.includes('xxxx')) {
        await new Promise((r) => setTimeout(r, 1500));
        throw new Error('MOCK_MODE');
      }

      const response = await fetch(IMAGE_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${IMAGE_AI_KEY}`,
        },
        body: JSON.stringify({
          model: IMAGE_AI_MODEL,
          prompt: fullPrompt,
          image_size: size,
          num_inference_steps: 25,
          seed: Math.floor(Math.random() * 1000000),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const imageUrl = data.data?.[0]?.url;

      // 更新状态 (仅使用临时链接预览，稍后在确认时统一转存)
      const newStory = { ...generatedStory, cover: imageUrl };
      setGeneratedStory(newStory);
      message.success({ content: '封面生成成功！', key: 'cover_gen' });
    } catch (error) {
      if (error.message === 'MOCK_MODE') {
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        const settings = coverSettings;
        const size = settings.size || '1024x1024';
        const newStory = {
          ...generatedStory,
          cover: `https://placehold.co/${size.replace('x', 'x')}/${randomColor}/ffffff?text=Cover:${encodeURIComponent(generatedStory.title)}`,
        };
        setGeneratedStory(newStory);
        message.success({ content: '演示模式: Mock 封面已生成', key: 'cover_gen' });
      } else {
        message.error({ content: '封面失败: ' + error.message, key: 'cover_gen' });
      }
    } finally {
      setCoverLoading(false);
    }
  };

  // 3. 提交到表单 (在这里统一转存图片)
  const handleConfirm = async () => {
    if (!onStoryGenerated) return;

    if (!generatedStory) {
      // 没有任何生成内容时，可能不执行任何操作
      return;
    }

    // 显示转存进度
    const hide = message.loading('正在保存所有图片资源...', 0);

    try {
      // Deep copy to avoid mutating state directly during process
      let finalStory = JSON.parse(JSON.stringify(generatedStory));

      // Helper function: save if URL is external
      const saveImageIfNeeded = async (url) => {
        // 如果已经是本地地址或者非http地址，跳过
        if (!url || url.includes('localhost') || !url.startsWith('http')) return url;

        try {
          const res = await fetch('http://localhost:5000/api/save-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url }),
          });
          const data = await res.json();
          if (data.url) return data.url;
          return url;
        } catch (e) {
          console.error('Failed to save image:', url, e);
          return url; // Fallback to original
        }
      };

      // 1. 转存封面
      if (finalStory.cover) {
        finalStory.cover = await saveImageIfNeeded(finalStory.cover);
      }

      // 2. 转存所有页面的图片
      if (finalStory.pages && Array.isArray(finalStory.pages)) {
        // 并行处理以加快速度，或者串行处理以减少后端压力
        // 这里选择串行循环，稳妥起见
        for (let i = 0; i < finalStory.pages.length; i++) {
          if (finalStory.pages[i].image) {
            finalStory.pages[i].image = await saveImageIfNeeded(finalStory.pages[i].image);
          }
        }
      }

      hide();
      onStoryGenerated(finalStory);
      message.success('故事导入成功！');
    } catch (err) {
      hide();
      console.error(err);
      message.error('保存图片失败，请重试');
    }
  };

  const renderCoverConfigContent = () => {
    const settings = coverSettings;
    const defaultPrompt = `Children's book cover, title "${generatedStory?.title}"`;

    return (
      <div style={{ width: 320 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong>封面提示词:</Text>
          <TextArea
            rows={3}
            placeholder="输入封面描述..."
            value={settings.prompt !== undefined ? settings.prompt : defaultPrompt}
            onChange={(e) => setCoverSettings({ ...settings, prompt: e.target.value })}
            style={{ marginTop: 5 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text strong>尺寸:</Text>
          <Select
            style={{ width: '100%', marginTop: 5 }}
            value={settings.size || '1024x1024'}
            onChange={(val) => setCoverSettings({ ...settings, size: val })}
          >
            {ASPECT_RATIOS.map((r) => (
              <Option key={r.value} value={r.value}>
                {r.label}
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>风格:</Text>
          <Select
            style={{ width: '100%', marginTop: 5 }}
            value={settings.style || 'children book style, cute, colorful'}
            onChange={(val) => setCoverSettings({ ...settings, style: val })}
          >
            {ART_STYLES.map((s) => (
              <Option key={s.value} value={s.value}>
                {s.label}
              </Option>
            ))}
          </Select>
        </div>
        <Button type="primary" block loading={coverLoading} onClick={handleGenerateCover}>
          {generatedStory?.cover && !generatedStory.cover.includes('placehold')
            ? '重新生成'
            : '生成封面'}
        </Button>
      </div>
    );
  };

  const renderImageConfigContent = (index) => {
    const settings = imageSettings[index] || {};
    const page = generatedStory.pages[index];

    return (
      <div style={{ width: 320 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong>提示词 (Prompt):</Text>
          <TextArea
            rows={3}
            placeholder="在此修改提示词..."
            value={settings.prompt !== undefined ? settings.prompt : page.imagePrompt}
            onChange={(e) => {
              const newSettings = { ...imageSettings };
              if (!newSettings[index]) newSettings[index] = {};
              newSettings[index].prompt = e.target.value;
              setImageSettings(newSettings);
            }}
            style={{ marginTop: 5 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Text strong>图片比例:</Text>
          <Select
            style={{ width: '100%', marginTop: 5 }}
            value={settings.size || '1024x1024'}
            onChange={(val) => {
              const newSettings = { ...imageSettings };
              if (!newSettings[index]) newSettings[index] = {};
              newSettings[index].size = val;
              setImageSettings(newSettings);
            }}
          >
            {ASPECT_RATIOS.map((r) => (
              <Option key={r.value} value={r.value}>
                {r.label}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>绘画风格:</Text>
          <Select
            style={{ width: '100%', marginTop: 5 }}
            value={settings.style || 'children book style, cute, colorful'}
            onChange={(val) => {
              const newSettings = { ...imageSettings };
              if (!newSettings[index]) newSettings[index] = {};
              newSettings[index].style = val;
              setImageSettings(newSettings);
            }}
          >
            {ART_STYLES.map((s) => (
              <Option key={s.value} value={s.value}>
                {s.label}
              </Option>
            ))}
          </Select>
        </div>

        <Button
          type="primary"
          block
          loading={imageLoading[index]}
          onClick={() => handleGenerateImage(index)}
        >
          {page.image ? '重新生成当前页' : '立即生成图片'}
        </Button>
      </div>
    );
  };

  return (
    <div className="ai-generator-container" style={{ padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title
          level={2}
          style={{
            background: 'linear-gradient(to right, #cf1322, #1890ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <RobotOutlined /> AI 魔法故事工坊
        </Title>
        <Paragraph type="secondary">输入你的创意，让 AI 帮你生成完整的手势互动故事！</Paragraph>
      </div>

      <Steps
        current={step}
        style={{ marginBottom: 40 }}
        items={[
          { title: '创意构思', description: '输入主题和类型', icon: <BulbOutlined /> },
          { title: '生成预览', description: '生成文本与插图', icon: <PictureOutlined /> },
          { title: '确认导入', description: '通过审核并编辑', icon: <CheckCircleOutlined /> },
        ]}
      />

      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            bordered={false}
            style={{ maxWidth: 800, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <Form form={form} layout="vertical" onFinish={handleGenerateStory}>
              <Form.Item
                name="theme"
                label="故事主题"
                rules={[{ required: true, message: '请输入主题' }]}
              >
                <Input
                  placeholder="例如：海底大冒险、森林里的数学课..."
                  size="large"
                  prefix={<RocketOutlined />}
                />
              </Form.Item>

              <Form.Item label="故事类型" required style={{ marginBottom: 0 }}>
                <Space style={{ display: 'flex', width: '100%' }} align="start">
                  <Form.Item
                    name="type"
                    rules={[{ required: true, message: '请选择主类型' }]}
                    initialValue="interactive"
                    style={{ flex: 1 }}
                  >
                    <Select
                      size="large"
                      placeholder="选择故事模式"
                      onChange={(val) => {
                        // Clear subtype if switching away from learning
                        if (val !== 'learning') {
                          form.setFieldsValue({ subtype: undefined });
                        }
                      }}
                    >
                      <Option value="interactive">✨ 沉浸互动 (手势推动剧情)</Option>
                      <Option value="learning">🎓 益智学习 (专项训练)</Option>
                      <Option value="non-interactive">📖 传统绘本 (点击阅读)</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                    {({ getFieldValue }) => {
                      return getFieldValue('type') === 'learning' ? (
                        <Form.Item
                          name="subtype"
                          rules={[{ required: true, message: '请选择学习类型' }]}
                          style={{ flex: 1 }}
                        >
                          <Select size="large" placeholder="选择学习类型">
                            <Option value="word">🔤 单词学习 (读单词)</Option>
                            <Option value="count">🔢 趣味数数 (做手势)</Option>
                            <Option value="math">➕ 简单算术 (做手势)</Option>
                          </Select>
                        </Form.Item>
                      ) : null;
                    }}
                  </Form.Item>
                </Space>
              </Form.Item>

              <Form.Item name="age" label="适合年龄" initialValue="3-6岁">
                <Select size="large">
                  <Option value="0-3岁">0-3岁 (简单认知)</Option>
                  <Option value="3-6岁">3-6岁 (逻辑互动)</Option>
                  <Option value="6-9岁">6-9岁 (复杂剧情)</Option>
                </Select>
              </Form.Item>

              <Form.Item name="prompt" label="更多要求 (可选)">
                <TextArea
                  placeholder="例如：希望主角是一只勇敢的小兔子，需要用到做 '点赞' 和 '挥手' 的手势..."
                  rows={4}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  shape="round"
                  style={{
                    height: 50,
                    fontSize: 18,
                    background: 'linear-gradient(90deg, #722ed1, #1890ff)',
                    border: 'none',
                  }}
                >
                  开始生成魔法故事 ✨
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </motion.div>
      )}

      {step === 1 && generatedStory && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <Title level={4}>预览生成的剧本</Title>
              <Card
                title={generatedStory.title}
                extra={<Text type="secondary">{generatedStory.type}</Text>}
              >
                {generatedStory.pages.map((page, index) => (
                  <Card
                    key={index}
                    type="inner"
                    title={`第 ${index + 1} 页`}
                    style={{ marginBottom: 16 }}
                  >
                    <p>
                      <strong>内容：</strong>
                      {page.content}
                    </p>
                    <p>
                      <strong>手势：</strong>
                      {page.requiredGesture || '无'} ({page.gestureHint})
                    </p>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          AI 绘图提示词: {page.imagePrompt}
                        </Text>
                      </div>
                      {page.image && (
                        <img
                          src={page.image}
                          alt="preview"
                          style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
                        />
                      )}

                      <Popover
                        content={renderImageConfigContent(index)}
                        title="自定义绘图参数"
                        trigger="click"
                        placement="right"
                      >
                        <Button
                          block
                          icon={page.image ? <ReloadOutlined /> : <SettingOutlined />}
                          type={page.image ? 'default' : 'dashed'}
                          style={{ height: 40 }}
                          loading={imageLoading[index]}
                        >
                          {page.image ? '调整参数 / 重新生成' : '自定义生成插图'}
                        </Button>
                      </Popover>
                    </Space>
                  </Card>
                ))}
              </Card>
            </div>

            <div style={{ width: 300 }}>
              <div style={{ position: 'sticky', top: 20 }}>
                <Card
                  title="书籍封面"
                  style={{ marginBottom: 20 }}
                  cover={
                    generatedStory.cover ? (
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                          alt="cover"
                          src={generatedStory.cover}
                          style={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          height: 200,
                          background: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ccc',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <Space direction="vertical" align="center">
                          <PictureOutlined style={{ fontSize: 32 }} />
                          <Text type="secondary">AI 封面预览</Text>
                        </Space>
                      </div>
                    )
                  }
                >
                  <Popover
                    content={renderCoverConfigContent()}
                    title="封面生成设置"
                    trigger="click"
                    placement="bottom"
                  >
                    <Button block type="default" icon={<SettingOutlined />} loading={coverLoading}>
                      {generatedStory.cover && !generatedStory.cover.includes('placehold')
                        ? '调整 / 重新制作'
                        : '一键生成封面'}
                    </Button>
                  </Popover>
                </Card>

                <Card title="操作">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      block
                      size="large"
                      onClick={handleConfirm}
                      icon={<EditOutlined />}
                    >
                      导入并继续编辑
                    </Button>
                    <Button block onClick={() => setStep(0)}>
                      重新构思
                    </Button>
                  </Space>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AiStoryGenerator;
