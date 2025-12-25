import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Select, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import ImageUploader from './ImageUploader';

const { Title } = Typography;
const { TextArea } = Input;
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
          pages: [{ pageId: 1, content: '', image: '', requiredGesture: '', gestureHint: '' }],
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
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  title={`第 ${index + 1} 页`}
                  extra={
                    fields.length > 1 ? (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      >
                        删除此页
                      </Button>
                    ) : null
                  }
                  className="page-item-card"
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'content']}
                    label="文字内容"
                    rules={[{ required: true, message: '请输入页面内容' }]}
                  >
                    <TextArea rows={3} placeholder="请输入这一页的故事内容..." />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'image']} label="页面图片">
                    <ImageUploader />
                  </Form.Item>

                  <div className="gesture-row">
                    <Form.Item
                      {...restField}
                      name={[name, 'requiredGesture']}
                      label="交互手势 (可选)"
                    >
                      <Select placeholder="选择手势">
                        <Option value="">无 (普通阅读页)</Option>
                        <Option value="NUMBER_ONE">☝️ 数字1</Option>
                        <Option value="VICTORY">✌️ 数字2 (胜利手势)</Option>
                        <Option value="OK">👌 数字3 (OK手势)</Option>
                        <Option value="NUMBER_FOUR">4️⃣ 数字4</Option>
                        <Option value="OPEN_PALM">✋ 数字5 (张开手掌)</Option>
                        <Option value="THUMB_UP">👍 竖起大拇指</Option>
                        <Option value="CLOSED_FIST">✊ 握拳</Option>
                        <Option value="WAVE">👋 挥挥手</Option>
                        <Option value="HEART">❤️ 比心</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.pages[name]?.requiredGesture !==
                        currentValues.pages[name]?.requiredGesture
                      }
                    >
                      {({ getFieldValue }) => {
                        const gesture = getFieldValue(['pages', name, 'requiredGesture']);
                        return gesture ? (
                          <Form.Item
                            {...restField}
                            name={[name, 'gestureHint']}
                            label="手势提示语"
                            rules={[{ required: true, message: '请输入提示语' }]}
                          >
                            <Input placeholder="例如：竖起大拇指确认！" />
                          </Form.Item>
                        ) : null;
                      }}
                    </Form.Item>
                  </div>
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
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
