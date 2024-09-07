import { useState } from 'react'
import { App, ConfigProvider } from 'antd'
import { PageContainer, ProCard, ProLayout } from '@ant-design/pro-components'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutSettings } from '@/layout-config'
import AppRouter from '@/router'
import Styles from '@/styles/app.module.less'

export default () => {
  const location = useLocation()
  const [pathname, setPathname] = useState(location.pathname)

  return (
    <ConfigProvider
      theme={{
        components: {
          Form: {
            screenXSMax: 0
          }
        }
      }}
    >
      <App className={Styles.vink}>
        <ProLayout
          {...LayoutSettings}
          location={{ pathname }}
          menuItemRender={(item, dom) => <NavLink onClick={() => setPathname(item.path || '/')} to={item.path || '/'}>{dom}</NavLink>}
        >
          <PageContainer title={false}>
            <AppRouter />
          </PageContainer>
        </ProLayout>
      </App >
    </ConfigProvider>
  )
}
