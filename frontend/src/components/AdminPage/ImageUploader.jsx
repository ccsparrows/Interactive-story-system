import React, { useState } from 'react';
import { Upload, Button, Input, Radio, Image, message, Typography, Modal } from 'antd';
import { UploadOutlined, LinkOutlined, FileImageOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

// 图片压缩并转 Base64 辅助函数
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 最大尺寸限制
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // 压缩质量 0.7，强制转为 jpeg 以支持压缩
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const ImageUploader = ({ value, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [mode, setMode] = useState('url'); // 'url' or 'file'
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (info) => {
    const file = info.file;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        message.error('图片太大啦，请选择小于 10MB 的图片');
        return;
      }

      setCompressing(true);
      try {
        const base64 = await compressImage(file);
        setTempValue(base64);
        message.success('图片已自动压缩');
      } catch (err) {
        console.error(err);
        message.error('图片处理失败');
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleOpenModal = () => {
    setTempValue(''); // 打开时不带入旧值
    setMode('url');
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (tempValue) {
      onChange(tempValue);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="image-uploader-wrapper">
      {/* 主界面：仅显示预览和重传按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {value ? (
          <div className="image-preview-container">
            <Image
              src={value}
              alt="Preview"
              height={100}
              className="preview-image"
              fallback="https://via.placeholder.com/150?text=Error"
            />
          </div>
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              background: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            暂无图片
          </div>
        )}
        <Button onClick={handleOpenModal} icon={<UploadOutlined />}>
          {value ? '重传图片' : '上传图片'}
        </Button>
        {value && (
          <Button danger icon={<DeleteOutlined />} onClick={() => onChange('')}>
            删除图片
          </Button>
        )}
      </div>

      {/* 上传 Modal */}
      <Modal
        title="上传图片"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="确认使用"
        cancelText="取消"
        confirmLoading={compressing}
        destroyOnClose
      >
        <div className="radio-group-container" style={{ marginBottom: 16 }}>
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="url">
              <LinkOutlined /> 网络链接
            </Radio.Button>
            <Radio.Button value="file">
              <FileImageOutlined /> 本地上传
            </Radio.Button>
          </Radio.Group>
        </div>

        {mode === 'url' ? (
          <Input
            value={tempValue && !tempValue.startsWith('data:') ? tempValue : ''}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="请输入图片 URL (https://...)"
            prefix={<LinkOutlined className="input-prefix-icon" />}
          />
        ) : (
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileChange({ file });
              return false; // 阻止自动上传
            }}
          >
            <Button icon={<UploadOutlined />} loading={compressing} block>
              {compressing ? '处理中...' : '点击选择图片'}
            </Button>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" className="upload-hint">
                支持 JPG, PNG (Max 10MB, 自动压缩)
              </Text>
            </div>
          </Upload>
        )}

        {tempValue && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">新图片预览：</Text>
            <div
              style={{
                marginTop: 8,
                border: '1px solid #f0f0f0',
                padding: 8,
                borderRadius: 4,
                textAlign: 'center',
              }}
            >
              <Image
                src={tempValue}
                alt="New Preview"
                height={150}
                style={{ objectFit: 'contain', maxWidth: '100%' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImageUploader;
