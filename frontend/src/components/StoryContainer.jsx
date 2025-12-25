import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, message, Select, Space } from 'antd';
import { HomeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import GestureCamera from './GestureCamera';
import StoryPage from './StoryPage';
import { getStoryById } from '../services/apiService';
import '../styles/StoryContainer.less';

const { Option } = Select;

const StoryContainer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastGestureTime, setLastGestureTime] = useState(0);

  useEffect(() => {
    const loadStory = async () => {
      try {
        const data = await getStoryById(id);
        setStory(data);
      } catch (error) {
        message.error('加载故事失败');
      }
    };
    loadStory();
  }, [id]);

  const handleNextPage = useCallback(() => {
    if (!story) return;
    if (currentPageIndex < story.pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    } else {
      message.success('故事结束！真棒！');
      navigate('/'); // 返回首页
    }
  }, [story, currentPageIndex, navigate]);

  const handlePrevPage = (e) => {
    e.stopPropagation();
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleManualNext = (e) => {
    e.stopPropagation();
    handleNextPage();
  };

  const handlePageSelect = (value) => {
    setCurrentPageIndex(value);
  };

  const handleGesture = useCallback(
    (gesture) => {
      if (!story) return;
      if (story.type === 'non-interactive') return; // 非交互模式忽略手势

      const now = Date.now();
      if (now - lastGestureTime < 2000) return;

      const currentPage = story.pages[currentPageIndex];
      if (!currentPage) return;
      let required = currentPage.requiredGesture;

      // 移除旧的自动映射逻辑，现在 gestureService 会区分 OPEN_PALM 和 WAVE
      // if (required === 'WAVE' && gesture === 'OPEN_PALM') gesture = 'WAVE';

      if (gesture === required) {
        console.log('Gesture Matched!');
        setLastGestureTime(now);
        setIsAnimating(true);

        setTimeout(() => {
          setIsAnimating(false);
          handleNextPage();
        }, 1500);
      }
    },
    [story, currentPageIndex, lastGestureTime, handleNextPage]
  );

  // 处理点击翻页：如果故事是非交互类型，或者当前页不需要手势，则允许点击翻页
  const handleClick = () => {
    if (!story) return;

    const currentPage = story.pages[currentPageIndex];
    // 如果故事本身是非交互的，或者当前页没有要求的动作，则允许点击翻页
    if (story.type === 'non-interactive' || !currentPage?.requiredGesture) {
      handleNextPage();
    }
  };

  if (!story)
    return (
      <div className="loading-container">
        <Spin size="large" tip="正在加载故事..." />
      </div>
    );

  return (
    <div className="story-container" onClick={handleClick}>
      <Button
        icon={<HomeOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          navigate('/');
        }}
        className="home-btn"
        shape="round"
        size="large"
      >
        返回首页
      </Button>

      <StoryPage
        page={story.pages[currentPageIndex]}
        isAnimating={isAnimating}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        currentPage={currentPageIndex + 1}
        totalPages={story.pages.length}
      />

      {story.type !== 'non-interactive' && <GestureCamera onGestureDetected={handleGesture} />}
    </div>
  );
};

export default StoryContainer;
