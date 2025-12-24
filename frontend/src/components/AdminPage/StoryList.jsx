import React from 'react';
import { List, Card, Button, Popconfirm, Typography, Empty, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const StoryList = ({ stories, loading, onEdit, onDelete }) => {
  return (
    <List
      grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
      dataSource={stories}
      loading={loading}
      locale={{ emptyText: <Empty description="暂无故事，快去添加一个吧！" /> }}
      renderItem={(story) => (
        <List.Item>
          <Card
            hoverable
            actions={[
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(story)}
                className="edit-btn"
              >
                编辑
              </Button>,
              <Popconfirm
                title="确定要删除这个故事吗？"
                onConfirm={() => onDelete(story.id)}
                okText="是"
                cancelText="否"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            <Card.Meta
              avatar={
                <div className="story-avatar-container">
                  {story.cover || story.firstImage ? (
                    <img
                      src={story.cover || story.firstImage}
                      alt={story.title}
                      className="story-avatar-image"
                    />
                  ) : (
                    <span className="story-avatar-placeholder">{story.title.charAt(0)}</span>
                  )}
                </div>
              }
              title={story.title}
              description={
                <div style={{ marginTop: 8 }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color={story.type === 'non-interactive' ? 'green' : 'blue'}>
                        {story.type === 'non-interactive' ? '📖 阅读' : '✨ 互动'}
                      </Tag>
                      <Tag color="orange">{story.pageCount || 0} 页</Tag>
                    </Space>
                    <Text type="secondary" className="story-id-text" style={{ fontSize: '12px' }}>
                      ID: {story.id}
                    </Text>
                  </Space>
                </div>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );
};

export default StoryList;
