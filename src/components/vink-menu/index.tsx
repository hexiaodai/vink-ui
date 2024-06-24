import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { DesktopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import Sider from 'antd/es/layout/Sider'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  {
    key: 'virtualresources',
    label: '虚拟资源',
    type: 'group',
    children: [
      {
        key: '/virtualmachines',
        label: <Link to="/virtualmachines">虚拟机</Link>,
        icon: <DesktopOutlined />
      }
    ]
  }
]

const VinkMenu: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Sider
      theme="light"
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
    >
      <Menu defaultSelectedKeys={['/virtualmachines']} mode="inline" items={items} />
    </Sider>
  )
}

export default VinkMenu
