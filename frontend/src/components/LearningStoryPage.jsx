import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Typography, Badge, Avatar, message } from 'antd';
import {
  CalculatorOutlined,
  ReadOutlined,
  NumberOutlined,
  BulbOutlined,
  CheckCircleFilled,
  AudioOutlined,
} from '@ant-design/icons';
import '../styles/LearningStoryPage.less';

const { Title, Text } = Typography;

const LearningStoryPage = ({ page, isAnimating, learningType, onSuccess }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // learningType can be 'math', 'word', 'count' -> passed from parent based on metadata or infer type
  // If not passed, we can infer from page data

  const detectType = () => {
    if (learningType) return learningType;
    if (
      page.gestureHint &&
      (page.gestureHint.includes('算') || page.content.includes('+') || page.content.includes('-'))
    )
      return 'math';
    if (page.gestureHint && (page.gestureHint.includes('读') || page.gestureHint.includes('单词')))
      return 'word';
    return 'count'; // Default to counting/observation
  };

  const currentType = detectType();

  // 语音识别逻辑
  useEffect(() => {
    if (currentType !== 'word' || isAnimating) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Browser does not support Speech Recognition');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isCompActive = true; // 防止组件卸载后回调执行

    recognition.onstart = () => {
      if (isCompActive) {
        setIsListening(true);
        setTranscript('');
      }
    };

    recognition.onend = () => {
      // 只有在当前 effect 仍然有效，且需要继续监听时才尝试重启
      if (isCompActive && !isAnimating && currentType === 'word') {
        try {
          recognition.start();
          // 重启成功则不设置 false，避免 UI 闪烁
        } catch (e) {
          console.log('Auto-restart skipped', e);
          if (isCompActive) setIsListening(false);
        }
      } else {
        if (isCompActive) setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        if (isCompActive) setIsListening(false);
      }
    };

    recognition.onresult = (event) => {
      if (!isCompActive) return;

      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        console.log('Heard:', finalTranscript);
        setTranscript(finalTranscript);

        const targetWord = page.expectedText || page.content.replace(/[^a-zA-Z]/g, '');

        if (finalTranscript.toLowerCase().includes(targetWord.toLowerCase())) {
          recognition.stop();
          message.success(`真棒！你学会了 "${targetWord}"！`);
          if (onSuccess) onSuccess();
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      isCompActive = false;
      recognition.stop();
    };
  }, [page, currentType, isAnimating, onSuccess]);

  // Rendering helpers
  const renderMathContent = () => {
    // Assuming content is like "1 + 2 = ?"
    // Or we parse it. For now, let's display page.content directly as a large equation if it fits
    return <div className="math-equation">{page.content}</div>;
  };

  const renderWordContent = () => {
    const hasImage = !!page.image;
    return (
      <div
        className="word-display"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: hasImage ? 'flex-start' : 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        {page.image && (
          <img
            src={page.image}
            alt="word"
            className="main-image"
            style={{ marginBottom: 20, maxHeight: '40vh', objectFit: 'contain' }}
          />
        )}
        <div
          style={{
            fontSize: '80px',
            fontWeight: 'bold',
            color: '#1890ff',
            marginTop: hasImage ? '10px' : '0',
          }}
        >
          {page.content}
        </div>

        {/* 语音状态提示 */}
        <div
          style={{ fontSize: '20px', marginTop: '20px', color: isListening ? '#52c41a' : '#ccc' }}
        >
          <AudioOutlined spin={isListening} /> {isListening ? '正在聆听...' : '麦克风准备中...'}
          {transcript && (
            <div style={{ fontSize: '16px', color: '#666' }}>听到: "{transcript}"</div>
          )}
        </div>
      </div>
    );
  };

  const renderCountContent = () => {
    return (
      <div className="count-display">
        {page.image && <img src={page.image} alt="count" className="main-image" />}
        <Title level={3}>{page.content}</Title>
      </div>
    );
  };

  const getIcon = () => {
    switch (currentType) {
      case 'math':
        return <CalculatorOutlined style={{ fontSize: 40, color: '#ffadd2' }} />;
      case 'word':
        return <ReadOutlined style={{ fontSize: 40, color: '#91d5ff' }} />;
      case 'count':
        return <NumberOutlined style={{ fontSize: 40, color: '#b7eb8f' }} />;
      default:
        return <BulbOutlined />;
    }
  };

  const getColor = () => {
    switch (currentType) {
      case 'math':
        return '#fff0f6';
      case 'word':
        return '#e6f7ff';
      case 'count':
        return '#f6ffed';
      default:
        return '#ffffff';
    }
  };

  return (
    <div
      className={`learning-story-page ${isAnimating ? 'correct-answer' : ''}`}
      style={{ backgroundColor: getColor() }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={page.pageId}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`content-card ${currentType}-mode`}
        >
          <div className="question-header">
            {getIcon()}
            <span style={{ marginLeft: 10, textAlign: 'center' }}>第 {page.pageId} 关</span>
          </div>

          <div className="visual-area">
            {currentType === 'math' && renderMathContent()}
            {currentType === 'word' && renderWordContent()}
            {currentType === 'count' && renderCountContent()}
          </div>

          <div className="instruction-bar">
            <div className="hint-text">
              <BulbOutlined />
              {page.gestureHint || '做出正确的手势！'}
            </div>
            {isAnimating && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.5 }}
                style={{ color: '#52c41a', fontSize: '40px' }}
              >
                <CheckCircleFilled />
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LearningStoryPage;
