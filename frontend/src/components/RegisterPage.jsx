import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { register } from '../services/apiService';
import '../styles/Auth.less';

const { Content } = Layout;
const { Title, Text, Link } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register(values.username, values.password, values.email);
      message.success("注册成功！请登录");
      navigate('/login');
    } catch (err) {
      message.error(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="auth-layout">
      <Content className="auth-content">
        <Card 
          className="auth-card"
          bordered={false}
        >
          <div className="auth-header">
            <Title level={2}>创建账号 🚀</Title>
            <Text type="secondary">加入我们，开始您的故事之旅</Text>
          </div>

          <Form
            name="register_form"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            scrollToFirstError
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!', whitespace: true }]}
            >
              <Input 
                prefix={<UserOutlined className="site-form-item-icon" />} 
                placeholder="用户名" 
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址!' },
                { required: true, message: '请输入邮箱!' },
              ]}
            >
              <Input 
                prefix={<MailOutlined className="site-form-item-icon" />} 
                placeholder="邮箱" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码长度不能少于6位!' }
              ]}
              hasFeedback
            >
              <Input.Password 
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="密码" 
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="确认密码" 
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} icon={<UserAddOutlined />}>
                注 册
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            <Text type="secondary">已有账号? </Text>
            <Link onClick={() => navigate('/login')}>去登录</Link>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default RegisterPage;

