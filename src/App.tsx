import React, { useState } from 'react';
import { Layout, theme } from 'antd'
import MainMenu from '@/components/main-menu'
import SideMenu from '@/components/side-menu'
import AppRouter from '@/router/index'

const { Content } = Layout

const App: React.FC = () => {
  const {
    token: { borderRadiusLG }
  } = theme.useToken()

  const [mainMenu, setMainMenu] = useState<any>({ key: 'vink' })

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <MainMenu onSelect={(key: string) => setMainMenu(key)} />
      <Layout hasSider>
        <SideMenu mainMenu={mainMenu} />
        <Content style={{ borderRadius: borderRadiusLG }}>
          <AppRouter />
        </Content>
      </Layout>
    </Layout >
  )
}

export default App
