import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Button,
  Space,
  Empty,
  Tag,
  Popover,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  ReadOutlined,
  StarFilled,
  BgColorsOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { getStories } from '../services/apiService';
import '../styles/HomePage.less';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;

const themes = [
  {
    key: 'purple',
    name: '梦幻紫',
    background: 'linear-gradient(135deg, #e0f7fa 0%, #e1bee7 100%)',
    circle1: 'radial-gradient(circle, #ffec3d 0%, rgba(255, 236, 61, 0) 70%)',
    circle2: 'radial-gradient(circle, #40a9ff 0%, rgba(64, 169, 255, 0) 70%)',
    primaryColor: '#722ed1',
  },
  {
    key: 'blue',
    name: '海洋蓝',
    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
    circle1: 'radial-gradient(circle, #69c0ff 0%, rgba(105, 192, 255, 0) 70%)',
    circle2: 'radial-gradient(circle, #1890ff 0%, rgba(24, 144, 255, 0) 70%)',
    primaryColor: '#1890ff',
  },
  {
    key: 'green',
    name: '森林绿',
    background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
    circle1: 'radial-gradient(circle, #95de64 0%, rgba(149, 222, 100, 0) 70%)',
    circle2: 'radial-gradient(circle, #52c41a 0%, rgba(82, 196, 26, 0) 70%)',
    primaryColor: '#52c41a',
  },
  {
    key: 'pink',
    name: '甜蜜粉',
    background: 'linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)',
    circle1: 'radial-gradient(circle, #ffadd2 0%, rgba(255, 173, 210, 0) 70%)',
    circle2: 'radial-gradient(circle, #eb2f96 0%, rgba(235, 47, 150, 0) 70%)',
    primaryColor: '#eb2f96',
  },
  {
    key: 'orange',
    name: '活力橙',
    background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
    circle1: 'radial-gradient(circle, #ffd591 0%, rgba(255, 213, 145, 0) 70%)',
    circle2: 'radial-gradient(circle, #fa8c16 0%, rgba(250, 140, 22, 0) 70%)',
    primaryColor: '#fa8c16',
  },
];

const HomePage = () => {
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load theme
    const savedThemeKey = localStorage.getItem('homeTheme');
    if (savedThemeKey) {
      const theme = themes.find((t) => t.key === savedThemeKey);
      if (theme) setCurrentTheme(theme);
    }

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

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('homeTheme', theme.key);
  };

  const themeContent = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
      {themes.map((theme) => (
        <Tooltip title={theme.name} key={theme.key}>
          <div
            onClick={() => handleThemeChange(theme)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: theme.background,
              cursor: 'pointer',
              border:
                currentTheme.key === theme.key
                  ? `2px solid ${theme.primaryColor}`
                  : '1px solid #ddd',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentTheme.key === theme.key && (
              <CheckOutlined
                style={{ color: theme.primaryColor, fontSize: '14px', fontWeight: 'bold' }}
              />
            )}
          </div>
        </Tooltip>
      ))}
    </div>
  );

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
    <Layout className="home-layout" style={{ background: currentTheme.background }}>
      {/* 装饰背景元素 */}
      <div className="bg-decoration circle-1" style={{ background: currentTheme.circle1 }} />
      <div className="bg-decoration circle-2" style={{ background: currentTheme.circle2 }} />
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
          <Popover
            content={themeContent}
            title="选择喜欢的颜色主题 🎨"
            trigger="click"
            placement="bottomRight"
          >
            <Button
              shape="circle"
              icon={<BgColorsOutlined style={{ color: currentTheme.primaryColor }} />}
              size="large"
              className="action-btn"
            />
          </Popover>
          {user && user.role === 'admin' && (
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => navigate('/admin')}
              shape="round"
              size="large"
              className="action-btn admin-btn"
            >
              管理后台
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
                                {story.type === 'learning' ? (
                                  <Tag color="purple" icon={<ReadOutlined />}>
                                    益智学习
                                  </Tag>
                                ) : (
                                  <Tag color={story.type === 'non-interactive' ? 'green' : 'blue'}>
                                    {story.type === 'non-interactive' ? '📖 阅读' : '✨ 互动'}
                                  </Tag>
                                )}
                                <Tag color="orange">{story.pages?.length || 0} 页</Tag>
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
