import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, message, Select, Space } from 'antd';
import { HomeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import GestureCamera from './GestureCamera';
import StoryPage from './StoryPage';
import LearningStoryPage from './LearningStoryPage';
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

  // 抽离成功的处理逻辑
  const handleSuccess = useCallback(() => {
    setLastGestureTime(Date.now());
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      handleNextPage();
    }, 1500);
  }, [handleNextPage]);

  const handleGesture = useCallback(
    (gesture) => {
      if (!story) return;
      const currentPage = story.pages[currentPageIndex];
      // 如果不是交互式故事且当前页不需要手势，则忽略
      if (story.type === 'non-interactive' && !currentPage?.requiredGesture) return;

      const now = Date.now();
      if (now - lastGestureTime < 2000) return;

      if (!currentPage) return;
      let required = currentPage.requiredGesture;

      if (gesture === required) {
        console.log('Gesture Matched!');
        handleSuccess();
      }
    },
    [story, currentPageIndex, lastGestureTime, handleSuccess] // dependency updated
  );

  // 处理点击翻页：如果故事是非交互类型，或者当前页不需要手势（且不是语音类型），则允许点击翻页
  // 注意：LearningStoryPage 如果是 'word' 类型，也不应该允许随便点击翻页，除非实现了另外的逻辑
  const handleClick = () => {
    if (!story) return;

    const currentPage = story.pages[currentPageIndex];
    // 如果故事本身是非交互的，或者当前页没有要求的动作，则允许点击翻页
    // 如果是 'word' 学习类型，我们希望通过语音触发，所以这里可能要限制一下，防止误触，暂且允许
    if (story.type === 'non-interactive' || !currentPage?.requiredGesture) {
      // 这里的逻辑有点微妙，如果 requiredGesture 为 null 可能会直接翻页
      // 对于 voice 交互，我们希望由 LearningStoryPage 触发 onSuccess
      // 所以如果 type 是 learning 且 subtype 是 word，我们在这里通过点击直接翻页作为一种"跳过"手段
      const pageType = currentPage.type || 'interactive';
      if (pageType !== 'word') {
        handleNextPage();
      }
    }
  };

  const renderPage = () => {
    if (!story)
      return (
        <div className="loading-container">
          <Spin size="large" tip="正在加载故事..." />
        </div>
      );

    const currentPage = story.pages[currentPageIndex];
    // 优先使用页面自己的类型，如果没有则回退到故事级别的类型逻辑（兼容旧数据）
    let rawType = currentPage.type;

    // Debug info (in production this would be removed, but helpful here)
    // console.log('Page Type:', rawType, 'Story Type:', story.type, 'Subtype:', story.subtype);

    let pageType = rawType;
    if (!pageType) {
      if (story.type === 'learning' && story.subtype) {
        pageType = story.subtype;
      } else {
        pageType = 'interactive';
      }
    }

    // Normalize type
    pageType = pageType.trim().toLowerCase();
    if (['math', 'word', 'count'].includes(pageType)) {
      return (
        <LearningStoryPage
          page={currentPage}
          isAnimating={isAnimating}
          learningType={pageType}
          onSuccess={handleSuccess}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          currentPage={currentPageIndex + 1}
          totalPages={story.pages.length}
        />
      );
    } else {
      // normal 或 interactive
      return (
        <StoryPage
          page={currentPage}
          isAnimating={isAnimating}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          currentPage={currentPageIndex + 1}
          totalPages={story.pages.length}
        />
      );
    }
  };

  if (!story) return null;

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

      {renderPage()}

      {(story.type !== 'non-interactive' || story.pages[currentPageIndex]?.requiredGesture) && (
        <GestureCamera onGestureDetected={handleGesture} />
      )}
    </div>
  );
};

export default StoryContainer;
