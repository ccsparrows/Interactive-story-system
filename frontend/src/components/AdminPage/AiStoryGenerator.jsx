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
  const [imageSettings, setImageSettings] = useState({}); // Track custom settings per page
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
      const userPrompt = `
          请创建一个关于 "${values.theme}" 的儿童互动故事。
          类型: ${values.type} (${values.type === 'learning' ? '包含简单的认知/数学任务' : '包含手势互动环节'})
          面向年龄: ${values.age}
          额外要求: ${values.prompt || '无'}
          
          请必须返回严格的 JSON 格式，结构如下:
          {
            "title": "故事标题",
            "type": "${values.type}",
            "subtype": "${values.type === 'learning' ? 'count/math/word 其中之一' : ''}",
            "ageRating": "${values.age}",
            "pages": [
              {
                "pageId": 1,
                "type": "当前页类型: word | math | count | interactive | normal (根据故事类型和内容判断)",
                "content": "剧情内容。如果是 word 类型，则仅输出英文单词。",
                "expectedText": "如果是 word 类型，必填此字段(英文单词); 其他类型留空",
                "imagePrompt": "该页面的英文绘画提示词(prompt)",
                "requiredGesture": "交互动作: THUMB_UP / OPEN_PALM / WAVE / OK / VICTORY / CLOSED_FIST / HEART。注意: word 类型必须为 null; math/count 类型可选; interactive 类型必填",
                "gestureHint": "给孩子的互动提示语。word 类型填中文释义; 其他类型填手势提示"
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
              content: `这是一个关于${values.theme}的奇幻开始...`,
              imagePrompt: `${values.theme}, fantasy children book illustration`,
              requiredGesture: 'THUMB_UP',
              gestureHint: '竖起大拇指出发！',
            },
            {
              pageId: 2,
              content: '遇到了新的挑战！',
              imagePrompt: `adventure scene, ${values.theme}`,
              requiredGesture: 'WAVE',
              gestureHint: '挥挥手解决困难！',
            },
          ],
        };
        if (values.type === 'learning') {
          mockAiResponse.subtype = 'count';
          mockAiResponse.pages = [
            {
              pageId: 1,
              content: '这里有几个苹果？',
              requiredGesture: 'OK',
              gestureHint: '3个，做OK手势',
              imagePrompt: '3 red apples',
            },
          ];
        }
        setGeneratedStory(mockAiResponse);
        setStep(1);
        message.success({ content: '演示模式：已生成 Mock 大纲 (请配置真实 Key)', key: 'ai_gen' });
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
      // 对于 Kolors 可能回传格式略有不同，但通常遵循 OpenAI 格式。如果需要适配 SiliconFlow 特殊格式请调整。
      // SiliconFlow Kolors output follows standard format.

      if (!imageUrl) throw new Error('Image URL not found in response');

      // 更新状态
      const newStory = { ...generatedStory };
      newStory.pages[pageIndex].image = imageUrl;
      // Also update the prompt used if user edited it, so it persists?
      // Optional: newStory.pages[pageIndex].imagePrompt = promptText;
      // Keeping original prompt separate is better for "undo".

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

  // 3. 提交到表单
  const handleConfirm = () => {
    if (onStoryGenerated) {
      onStoryGenerated(generatedStory);
      message.success('已填入编辑表单，请进行最后调整');
    }
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

              <Form.Item name="type" label="故事类型" rules={[{ required: true }]}>
                <Select size="large" placeholder="选择故事模式">
                  <Option value="interactive">✨ 沉浸互动 (手势推动剧情)</Option>
                  <Option value="learning">🎓 益智学习 (数数/单词/算术)</Option>
                  <Option value="non-interactive">📖 传统绘本 (点击阅读)</Option>
                </Select>
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
              <Card title="操作" style={{ position: 'sticky', top: 20 }}>
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
        </motion.div>
      )}
    </div>
  );
};

export default AiStoryGenerator;
