import React from 'react';
import { motion } from 'framer-motion';
import { Card, Typography, Button, Tag, Image, Space, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  CameraOutlined,
  LeftOutlined,
  RightOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import '../styles/StoryPage.less';

const { Title, Paragraph } = Typography;

const StoryPage = ({ page, isAnimating, onNextPage, onPrevPage, currentPage, totalPages }) => {
  const [extractedTheme, setExtractedTheme] = React.useState(null);

  React.useEffect(() => {
    if (!page || !page.image) {
      setExtractedTheme(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = page.image;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        // Draw the image resized to 1x1 to get average color
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

        // Generate theme colors based on this dominant color
        // bg: very light version (opacity 0.1)
        // border: the color itself or slightly lighter (opacity 0.6)
        // accent: the color with opacity (opacity 0.2)
        const bg = `rgba(${r}, ${g}, ${b}, 0.1)`;
        const border = `rgba(${r}, ${g}, ${b}, 0.6)`;
        const accent = `rgba(${r}, ${g}, ${b}, 0.2)`;

        setExtractedTheme({ bg, border, accent });
      } catch (e) {
        console.warn('Color extraction failed', e);
        setExtractedTheme(null);
      }
    };

    img.onerror = () => setExtractedTheme(null);
  }, [page]);

  if (!page) return <div className="story-page loading">Loading...</div>;

  // 随机主题色和布局 (基于 pageId 确定性生成，避免闪烁)
  const themes = [
    { bg: '#e6f7ff', border: '#91d5ff', accent: 'rgba(24, 144, 255, 0.3)' }, // Blue
    { bg: '#fff7e6', border: '#ffd591', accent: 'rgba(250, 140, 22, 0.3)' }, // Orange
    { bg: '#f6ffed', border: '#b7eb8f', accent: 'rgba(82, 196, 26, 0.3)' }, // Green
    { bg: '#fff0f6', border: '#ffadd2', accent: 'rgba(235, 47, 150, 0.3)' }, // Pink
    { bg: '#f0f5ff', border: '#adc6ff', accent: 'rgba(47, 84, 235, 0.3)' }, // Geek Blue
  ];
  const defaultTheme = themes[page.pageId % themes.length];
  const theme = extractedTheme || defaultTheme;
  const isImageRight = page.pageId % 2 !== 0; // 奇数页图片在右边

  const variants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, x: -100 },
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } },
    sparkle: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.5 },
    },
    zoom_in: { scale: [1, 1.5], transition: { duration: 0.5 } },
    sway: { rotate: [0, 5, -5, 5, -5, 0], transition: { duration: 1.5, ease: 'easeInOut' } },
  };

  let animateState = 'animate';
  if (isAnimating) {
    // 根据 page.animationTrigger 决定动画效果
    if (page.animationTrigger === 'shake') animateState = 'shake';
    else if (page.animationTrigger === 'sparkle') animateState = 'sparkle';
    else if (page.animationTrigger === 'zoom_in') animateState = 'zoom_in';
    // 如果是挥手手势，触发摇摆动画
    else if (page.requiredGesture === 'WAVE') animateState = 'sway';
  }

  const gestureMap = {
    THUMB_UP: '👍 竖起大拇指',
    OPEN_PALM: '✋ 张开手掌',
    VICTORY: '✌️ 胜利手势',
    CLOSED_FIST: '✊ 握拳',
    WAVE: '👋 挥挥手',
    HEART: '🫶 比心',
  };

  return (
    <div className="story-page">
      <motion.div
        key={page.pageId}
        className="story-card-motion-wrapper"
        initial="initial"
        animate={animateState}
        variants={variants}
        transition={{ duration: 0.5 }}
      >
        <Card
          className={`story-card ${isImageRight ? 'layout-right' : 'layout-left'}`}
          bordered={false}
          style={{
            backgroundColor: theme.bg,
            '--story-border': theme.border,
            '--story-accent': theme.accent,
          }}
        >
          {/* 书签导航 */}
          <div className="bookmark-nav" onClick={(e) => e.stopPropagation()}>
            <div className="bookmark-content">
              <Button
                type="text"
                size="small"
                icon={<LeftOutlined />}
                onClick={onPrevPage}
                disabled={currentPage === 1}
                className="nav-arrow"
              />
              <span className="page-num">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={onNextPage}
                disabled={currentPage === totalPages}
                className="nav-arrow"
              />
            </div>
            <div className="bookmark-tail" />
          </div>

          <div className="content-body">
            {page.image && (
              <div className="image-container">
                <Image
                  src={page.image}
                  alt={page.title || 'Page image'}
                  className="story-image"
                  preview={false}
                />
              </div>
            )}

            <div className="text-content">
              <div className="story-text-wrapper">
                <p className="story-text">{page.content}</p>
              </div>
            </div>
          </div>

          <div className="instruction">
            <Space direction="vertical">
              <Title level={4} className="instruction-title">
                任务: {page.gestureHint || '阅读故事'}
              </Title>
              {page.requiredGesture && (
                <Tag color="purple" className="gesture-tag">
                  <Tooltip title="请对着摄像头做出动作">
                    <QuestionCircleOutlined style={{ marginRight: 3, fontSize: 10 }} />
                  </Tooltip>
                  <CameraOutlined />： {gestureMap[page.requiredGesture] || page.requiredGesture}
                </Tag>
              )}
            </Space>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default StoryPage;
