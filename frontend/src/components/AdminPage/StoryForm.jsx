import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Select, message } from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import ImageUploader from './ImageUploader';
import PageCard from './StoryFormParts/PageCard';

const { Title } = Typography;
const { Option } = Select;

const StoryForm = ({ form, onFinish, isEditing, onCancel, initialValues }) => {
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={(errorInfo) => {
        console.log('Failed:', errorInfo);
        message.error('请检查表单填写是否完整');
      }}
      initialValues={
        initialValues || {
          pages: [
            {
              pageId: 1,
              type: 'interactive',
              content: '',
              image: '',
              requiredGesture: '',
              gestureHint: '',
            },
          ],
        }
      }
      className="story-form"
    >
      <Card
        title={isEditing ? '✏️ 编辑故事' : '📝 填写故事信息'}
        bordered={false}
        className="form-card"
      >
        <Form.Item
          name="title"
          label="故事标题"
          rules={[{ required: true, message: '请输入故事标题' }]}
        >
          <Input placeholder="例如：小红帽" size="large" />
        </Form.Item>

        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="subtype" hidden>
          <Input />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item name="ageRating" label="适龄建议" style={{ flex: 1 }} initialValue="3-6岁">
            <Select>
              <Option value="0-3岁">0-3岁 (启蒙)</Option>
              <Option value="3-6岁">3-6岁 (学前)</Option>
              <Option value="6-9岁">6-9岁 (小学低年级)</Option>
              <Option value="9-12岁">9-12岁 (小学高年级)</Option>
              <Option value="全年龄">全年龄</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="cover" label="封面图片">
          <ImageUploader />
        </Form.Item>
      </Card>

      <div className="pages-section">
        <Title level={4} className="pages-section-title">
          📖 故事页面内容
        </Title>
        <Form.List name="pages">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <PageCard key={field.key} field={field} index={index} remove={remove} form={form} />
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ type: 'interactive', content: '' })}
                  block
                  icon={<PlusOutlined />}
                  size="large"
                >
                  添加一页
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </div>

      <Form.Item className="form-actions">
        <Space size="large">
          {isEditing && <Button onClick={onCancel}>取消编辑</Button>}
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            className="save-button"
          >
            {isEditing ? '更新故事' : '保存故事'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default StoryForm;
