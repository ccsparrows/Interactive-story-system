import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { login } from '../services/apiService';
import '../styles/Auth.less';

const { Content } = Layout;
const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await login(values.identifier, values.password);
      // 简单存储用户信息
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('登录成功！');
      navigate('/');
    } catch (err) {
      message.error(err.message || '登录失败');
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
            <Title level={2}>欢迎回来 👋</Title>
            <Text type="secondary">请登录您的账号以继续</Text>
          </div>

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="identifier"
              rules={[{ required: true, message: '请输入用户名或邮箱!' }]}
            >
              <Input 
                prefix={<UserOutlined className="site-form-item-icon" />} 
                placeholder="用户名 / 邮箱" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} icon={<LoginOutlined />}>
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            <Text type="secondary">还没有账号? </Text>
            <Link onClick={() => navigate('/register')}>立即注册</Link>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;

