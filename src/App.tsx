import React from 'react';
import { Layout, theme } from 'antd'
import VinkMenu from './components/vink-menu'
import AppRouter from './router/index'

const { Content } = Layout

const App: React.FC = () => {
  const {
    token: { borderRadiusLG }
  } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <VinkMenu />
      <Layout>
        <Content style={{ margin: 16, borderRadius: borderRadiusLG }}>
          <AppRouter />
        </Content>
      </Layout>
    </Layout >
  )
}

export default App
