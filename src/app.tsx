import { useEffect, useState } from 'react'
import { App, ConfigProvider, Select } from 'antd'
import { PageContainer, ProLayout } from '@ant-design/pro-components'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutSettings } from '@/layout-config'
import { NamespaceProvider, useNamespace } from '@/common/context'
import { CustomResourceDefinition } from '@/apis/apiextensions/v1alpha1/custom_resource_definition'
import { clients } from './clients/clients'
import { GroupVersionResourceEnum } from './apis/types/group_version'
import AppRouter from '@/router'
import styles from '@/styles/app.module.less'

export default () => {
  const { notification } = App.useApp()

  const location = useLocation()

  const [pathname, setPathname] = useState(location.pathname)
  const [namespaces, setNamespaces] = useState<CustomResourceDefinition[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    clients.listResources(GroupVersionResourceEnum.NAMESPACE, setNamespaces, {
      notification: notification
    })
  }, [])

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
      <App className={styles.vink}>
        <NamespaceProvider>
          <ProLayout
            {...LayoutSettings}
            location={{ pathname }}
            collapsed={collapsed}
            onCollapse={setCollapsed}
            menuItemRender={(item, dom) => <NavLink onClick={() => setPathname(item.path || '/')} to={item.path || '/'}>{dom}</NavLink>}
            menuExtraRender={() => {
              if (collapsed) {
                return
              }
              const { namespace, setNamespace } = useNamespace()
              return <Select
                placeholder="工作空间"
                variant="filled"
                value={namespace}
                style={{ width: "100%", marginTop: 8, marginBottom: 8 }}
                onChange={(value) => setNamespace(value)}
                options={[
                  { value: '', label: '全部工作空间' },
                  ...namespaces.map((ns: CustomResourceDefinition) => ({
                    value: ns.metadata?.name,
                    label: ns.metadata?.name
                  }))
                ]}
              />
            }}
          >
            <PageContainer title={false}>
              <AppRouter />
            </PageContainer>
          </ProLayout>
        </NamespaceProvider>
      </App>
    </ConfigProvider>
  )
}
