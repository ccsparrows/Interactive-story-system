import React, { useState, useEffect } from 'react';
import { Layout, Typography, Form, Button, Tabs, Drawer, Spin, message } from 'antd';
import { PlusOutlined, EditOutlined, HomeOutlined, RobotOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getStories,
  createStory,
  updateStory,
  deleteStory,
  getStoryById,
} from '../../services/apiService';
import StoryForm from './StoryForm';
import StoryList from './StoryList';
import AiStoryGenerator from './AiStoryGenerator';
import '../../styles/AdminPage.less';

const { Title } = Typography;

const AdminPage = () => {
  const navigate = useNavigate();
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('add');
  const [stories, setStories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 新增状态：控制是否是从AI生成跳转过来的
  const [aiGeneratedData, setAiGeneratedData] = useState(null);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchStories();
    }
  }, [activeTab]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const data = await getStories();
      setStories(data);
    } catch (error) {
      message.error('获取故事列表失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinishAdd = async (values) => {
    // 扩展 pageId 逻辑
    const formattedPages = (values.pages || []).map((page, index) => ({
      ...page,
      pageId: index + 1,
    }));

    // 处理封面逻辑
    let finalCover = values.cover;
    if (!finalCover && formattedPages.length > 0 && formattedPages[0].image) {
      finalCover = formattedPages[0].image;
    }

    const storyData = {
      ...values,
      cover: finalCover,
      pages: formattedPages,
      // 关键新增：如果是 AI 导入的，确保 subtype 被带上
      subtype: values.subtype || aiGeneratedData?.subtype,
    };

    setLoading(true);
    try {
      await createStory(storyData);
      message.success('故事创建成功！');
      addForm.resetFields();
      setAiGeneratedData(null); // 清空 AI 数据
      // 成功后跳转到管理 tab 查看结果，或者回首页
      setActiveTab('manage');
      fetchStories();
    } catch (error) {
      message.error('创建失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理从 AI 生成器传回的数据
  const handleAiImport = (generatedStory) => {
    setAiGeneratedData(generatedStory);
    setActiveTab('add'); // 切换到添加页面

    // 自动填充表单
    // 注意：StoryForm 需要能接受这些字段
    // Pages 需要被展平，因为 mock 数据可能是嵌套的，但 form 期望的是数组
    const flattenPages = generatedStory.pages.flatMap((group) => group.items || [group]); // 兼容之前的 mock 结构 和 简单结构

    addForm.setFieldsValue({
      title: generatedStory.title,
      type: generatedStory.type,
      ageRating: generatedStory.ageRating,
      cover: generatedStory.cover,
      subtype: generatedStory.subtype, // 学习类型需要此字段
      pages: flattenPages.map((p) => ({
        content: p.content,
        image: p.image,
        requiredGesture: p.requiredGesture,
        gestureHint: p.gestureHint,
        animationTrigger: 'fade_in', // 默认值
      })),
    });
  };

  const onFinishEdit = async (values) => {
    console.log('onFinishEdit triggered', values);
    const formattedPages = values.pages.map((page, index) => ({
      ...page,
      pageId: index + 1,
    }));

    // 处理封面逻辑：如果未上传封面，则使用第一页的图片作为封面
    let finalCover = values.cover;
    if (!finalCover && formattedPages.length > 0 && formattedPages[0].image) {
      finalCover = formattedPages[0].image;
    }

    const storyData = {
      ...values,
      cover: finalCover,
      pages: formattedPages,
    };

    try {
      await updateStory(editingId, storyData);
      message.success('故事更新成功！');
      setDrawerVisible(false);
      setEditingId(null);
      fetchStories();
    } catch (error) {
      message.error('更新失败: ' + (error.message || '未知错误'));
    }
  };

  const handleEditClick = async (story) => {
    setEditingId(story.id);
    setDrawerVisible(true);
    setEditingStory(null);

    try {
      const fullStory = await getStoryById(story.id);
      if (fullStory) {
        setEditingStory(fullStory);
      } else {
        message.error('无法加载故事详情');
      }
    } catch (error) {
      message.error('加载失败: ' + error.message);
    }
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingId(null);
    setEditingStory(null);
    editForm.resetFields();
  };

  const handleDeleteClick = async (id) => {
    try {
      await deleteStory(id);
      message.success('删除成功');
      fetchStories();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };

  return (
    <Layout className="admin-layout">
      <Layout.Content className="admin-content">
        <div className="admin-header">
          <Title level={2}>📚 故事管理后台</Title>
          <Button shape="round" size="large" icon={<HomeOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>

        <div className="admin-tabs-container">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
            }}
            items={[
              {
                key: 'add',
                label: (
                  <span>
                    <PlusOutlined /> 添加故事
                  </span>
                ),
                children: (
                  <StoryForm
                    form={addForm}
                    onFinish={onFinishAdd}
                    isEditing={false}
                    initialValues={aiGeneratedData}
                  />
                ),
              },
              {
                key: 'ai-gen',
                label: (
                  <span
                    style={{
                      background: 'linear-gradient(90deg, #ff0080, #7928ca)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold',
                    }}
                  >
                    <RobotOutlined /> AI 魔法创作
                  </span>
                ),
                children: <AiStoryGenerator onStoryGenerated={handleAiImport} />,
              },
              {
                key: 'manage',
                label: (
                  <span>
                    <EditOutlined /> 管理故事
                  </span>
                ),
                children: (
                  <StoryList
                    stories={stories}
                    loading={loading}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ),
              },
            ]}
          />
        </div>

        <Drawer
          title="编辑故事"
          width={720}
          onClose={closeDrawer}
          open={drawerVisible}
          bodyStyle={{ paddingBottom: 80 }}
          destroyOnHidden={true}
        >
          {editingStory ? (
            <StoryForm
              form={editForm}
              onFinish={onFinishEdit}
              isEditing={true}
              onCancel={closeDrawer}
              initialValues={editingStory}
            />
          ) : (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
              <Spin size="large" tip="正在加载故事详情..." />
            </div>
          )}
        </Drawer>
      </Layout.Content>
    </Layout>
  );
};

export default AdminPage;
