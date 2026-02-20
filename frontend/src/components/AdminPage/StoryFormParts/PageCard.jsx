import React from 'react';
import { Form, Input, Select, Button, Card, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import ImageUploader from '../ImageUploader';

const { TextArea } = Input;
const { Option } = Select;

const PAGE_TYPES = {
  NORMAL: 'normal',
  INTERACTIVE: 'interactive',
  MATH: 'math',
  COUNT: 'count',
  WORD: 'word',
};

const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.NORMAL]: '普通页',
  [PAGE_TYPES.INTERACTIVE]: '互动页',
  [PAGE_TYPES.MATH]: '益智-算术',
  [PAGE_TYPES.COUNT]: '益智-数数',
  [PAGE_TYPES.WORD]: '益智-单词',
};

const PageCard = ({ field, index, remove, form }) => {
  // We need to watch the type to render different fields
  // create a watcher hook or use shouldUpdate in the parent,
  // but here we are inside a map.
  // The best way in AntD Form.List is using Form.Item with noStyle and shouldUpdate
  // But since we want to structure this cleanly, we can use Form.useWatch or passed props if lifted.
  // However, inside Form.List, sticking to Form.Item noStyle dependencies is robust.

  return (
    <Form.Item
      noStyle
      shouldUpdate={(prevValues, currentValues) => {
        return prevValues.pages?.[field.name]?.type !== currentValues.pages?.[field.name]?.type;
      }}
    >
      {({ getFieldValue }) => {
        const pageType = getFieldValue(['pages', field.name, 'type']) || PAGE_TYPES.INTERACTIVE; // Default to interactive as per request "standard"

        return (
          <Card
            title={
              <Space>
                <span>第 {index + 1} 页</span>
                <Form.Item
                  {...field}
                  name={[field.name, 'type']}
                  noStyle
                  initialValue={PAGE_TYPES.INTERACTIVE}
                >
                  <Select style={{ width: 140, fontWeight: 500 }} size="small">
                    {Object.entries(PAGE_TYPE_LABELS).map(([value, label]) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Space>
            }
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(field.name)}
              >
                删除
              </Button>
            }
            className="page-item-card"
            style={{ marginBottom: 16 }}
          >
            {/* Body Content based on Type */}
            <PageContentFields field={field} pageType={pageType} />
          </Card>
        );
      }}
    </Form.Item>
  );
};

// Sub-component to organize the internal fields
const PageContentFields = ({ field, pageType }) => {
  return (
    <>
      {/* 1. Content Area (Text or Equation) */}
      <Form.Item
        {...field}
        name={[field.name, 'content']}
        label={pageType === PAGE_TYPES.MATH ? '算式内容' : '文字内容'}
        rules={[{ required: true, message: '请输入内容' }]}
        initialValue={pageType === PAGE_TYPES.MATH ? '1 + 1 = ?' : ''}
      >
        <TextArea
          rows={3}
          placeholder={
            pageType === PAGE_TYPES.MATH ? '例如: 3 + 2 = ?' : '请输入这一页的故事内容...'
          }
        />
      </Form.Item>

      {/* 2. Image Area (Hidden for Math) */}
      {pageType !== PAGE_TYPES.MATH && (
        <Form.Item {...field} name={[field.name, 'image']} label="页面图片">
          <ImageUploader />
        </Form.Item>
      )}

      {/* 3. Interaction Area */}
      <div className="gesture-row" style={{ display: 'flex', gap: 16 }}>
        {/* Case: Word Learning - Show Word Input */}
        {pageType === PAGE_TYPES.WORD && (
          <Form.Item
            {...field}
            name={[field.name, 'expectedText']}
            label="阅读单词"
            rules={[{ required: true, message: '请输入单词' }]}
            style={{ flex: 1 }}
            initialValue="apple"
          >
            <Input placeholder="例如: apple" />
          </Form.Item>
        )}

        {/* Case: Interactive/Count/Math - Show Gesture Selector */}
        {/* Normal/Word do NOT show gesture selector */}
        {(pageType === PAGE_TYPES.INTERACTIVE ||
          pageType === PAGE_TYPES.COUNT ||
          pageType === PAGE_TYPES.MATH) && (
          <Form.Item
            {...field}
            name={[field.name, 'requiredGesture']}
            label="交互手势 (可选)"
            style={{ flex: 1 }}
          >
            <Select placeholder="选择手势" allowClear>
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
        )}

        {/* Hint Logic */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.pages?.[field.name]?.requiredGesture !==
              curr.pages?.[field.name]?.requiredGesture ||
            prev.pages?.[field.name]?.type !== curr.pages?.[field.name]?.type
          }
        >
          {({ getFieldValue }) => {
            const currentType = getFieldValue(['pages', field.name, 'type']);
            const gesture = getFieldValue(['pages', field.name, 'requiredGesture']);

            // Should we show a hint field?
            // 1. If type is WORD -> Show "Word Hint/Translation"
            // 2. If type is INTERACTIVE or COUNT and gesture selected -> Show "Gesture Hint"

            if (currentType === PAGE_TYPES.WORD) {
              return (
                <Form.Item
                  {...field}
                  name={[field.name, 'gestureHint']}
                  label="单词释义/提示"
                  initialValue="苹果"
                  style={{ flex: 1 }}
                >
                  <Input placeholder="例如: 苹果" />
                </Form.Item>
              );
            }

            if (
              (currentType === PAGE_TYPES.INTERACTIVE ||
                currentType === PAGE_TYPES.COUNT ||
                currentType === PAGE_TYPES.MATH) &&
              gesture
            ) {
              return (
                <Form.Item
                  {...field}
                  name={[field.name, 'gestureHint']}
                  label="手势提示语"
                  rules={[{ required: true, message: '请输入提示语' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="例如：竖起大拇指确认！" />
                </Form.Item>
              );
            }

            return null;
          }}
        </Form.Item>
      </div>
    </>
  );
};

export default PageCard;
