import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Avatar, Typography, Button, Space, Empty, Tag } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  ReadOutlined,
  StarFilled,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { getStories } from '../services/apiService';
import '../styles/HomePage.less';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;

const HomePage = () => {
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchStories = async () => {
      const data = await getStories();
      console.log('Fetched stories:', data);
      setStories(data);
    };
    fetchStories();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStoryClick = (id) => {
    navigate(`/story/${id}`);
  };

  // 容器动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // 卡片动画变体
  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
    hover: {
      scale: 1.05,
      rotate: [0, -2, 2, 0],
      transition: { duration: 0.3 },
    },
  };

  return (
    <Layout className="home-layout">
      {/* 装饰背景元素 */}
      <div className="bg-decoration circle-1" />
      <div className="bg-decoration circle-2" />
      <div className="bg-decoration cloud-1" />
      <Header className="home-header">
        <div className="user-info-container">
          <motion.div whileHover={{ scale: 1.1, rotate: 360 }} transition={{ duration: 0.5 }}>
            <Avatar
              size={56}
              src={user?.avatar}
              icon={!user?.avatar && <UserOutlined />}
              className="user-avatar"
            />
          </motion.div>
          <div className="user-details">
            <Title level={3} className="welcome-title">
              Hi, {user ? user.username : '小小探险家'}! <span className="wave-emoji">👋</span>
            </Title>
            <Text className="welcome-subtitle">准备好开始今天的魔法冒险了吗？</Text>
          </div>
        </div>
        <Space>
          {user && user.role === 'admin' && (
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => navigate('/admin')}
              shape="round"
              size="large"
              className="action-btn admin-btn"
            >
              魔法管理
            </Button>
          )}
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            shape="round"
            size="large"
            className="action-btn logout-btn"
          >
            退出
          </Button>
        </Space>
      </Header>

      <Content className="home-content">
        <div className="content-wrapper">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="section-header"
          >
            <Title level={2} className="section-title">
              <ReadOutlined className="icon-bounce" /> 故事书架
            </Title>
            <div className="section-decoration" />
          </motion.div>

          {stories.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ fontSize: '18px', color: '#666' }}>
                  暂时还没有故事哦，请管理员添加一些吧！
                </span>
              }
            />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <Row gutter={[32, 32]}>
                {stories.map((story, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={story.id}>
                    <motion.div variants={cardVariants} whileHover="hover">
                      <Card
                        hoverable
                        className="story-card-home"
                        onClick={() => handleStoryClick(story.id)}
                        cover={
                          <div className="story-cover-wrapper">
                            {story.cover || story.firstImage ? (
                              <img
                                alt={story.title}
                                src={story.cover || story.firstImage}
                                className="story-image"
                              />
                            ) : (
                              <div
                                className="placeholder-cover"
                                style={{ backgroundColor: `hsl(${index * 60}, 70%, 80%)` }}
                              >
                                <Title level={1} style={{ color: '#fff', margin: 0 }}>
                                  {story.title[0]}
                                </Title>
                              </div>
                            )}
                            <div className="story-overlay">
                              <Button
                                type="primary"
                                shape="round"
                                size="large"
                                icon={<StarFilled />}
                              >
                                开始阅读
                              </Button>
                            </div>
                          </div>
                        }
                      >
                        <Meta
                          title={<span className="story-card-title">{story.title}</span>}
                          description={
                            <div className="story-card-desc">
                              <Space wrap>
                                <Tag color={story.type === 'non-interactive' ? 'green' : 'blue'}>
                                  {story.type === 'non-interactive' ? '📖 阅读' : '✨ 互动'}
                                </Tag>
                                <Tag color="orange">{story.pageCount || 0} 页</Tag>
                                <Tag color="cyan">{story.ageRating || '3-6岁'}</Tag>
                              </Space>
                            </div>
                          }
                        />
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default HomePage;
