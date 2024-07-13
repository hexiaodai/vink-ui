import React from 'react';
import { Layout } from 'antd'
import MainMenu from '@/components/main-menu'
import SideMenu from '@/components/side-menu'
import AppRouter from '@/router/index'
import styles from '@/styles/app.module.less'

const { Content } = Layout

const App: React.FC = () => {
  return (
    <Layout className={styles.layout} >
      <MainMenu />
      <Layout hasSider>
        <SideMenu />
        <Layout>
          <Content>
            <AppRouter />
          </Content>
        </Layout>
      </Layout>
    </Layout >
  )
}

export default App
