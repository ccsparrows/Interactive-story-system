import React, { useState, useEffect } from 'react';
import { Layout, Typography, Form, Button, Tabs, Drawer, Spin, message } from 'antd';
import { PlusOutlined, EditOutlined, HomeOutlined } from '@ant-design/icons';
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
      await createStory(storyData);
      message.success('故事创建成功！');
      addForm.resetFields();
      navigate('/');
    } catch (error) {
      message.error('创建失败: ' + (error.message || '未知错误'));
    }
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
                children: <StoryForm form={addForm} onFinish={onFinishAdd} isEditing={false} />,
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
