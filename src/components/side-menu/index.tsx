import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { Link } from 'react-router-dom'
import { IconFont } from '@/components/icon/index'
import Sider from 'antd/es/layout/Sider'
import { DesktopOutlined, GlobalOutlined } from '@ant-design/icons'

interface SideMenuProps {
  mainMenu: any
}

type MenuItem = {
  values: Required<MenuProps>['items'][number][]
  defaultSelected: string
}

const virtual: MenuItem = {
  values: [
    {
      key: '/virtual/machines',
      label: <Link to="/virtual/machines">虚拟机</Link>,
      icon: <DesktopOutlined />
    },
    {
      key: '/virtual/images',
      label: <Link to="/virtual/images">镜像</Link>,
      icon: <IconFont type="icon-guangpan" />
    },
    {
      key: '/virtual/disks',
      label: <Link to="/virtual/disks">磁盘</Link>,
      icon: <IconFont type="icon-disk" />
    },
    {
      key: '/virtual/network',
      label: <Link to="/virtual/network">网络</Link>,
      icon: <GlobalOutlined />
    }
  ],
  defaultSelected: '/virtual/machines'
}

const getMenuItems = (mainMenu: string) => {
  switch (mainMenu) {
    case 'virtual':
      return virtual
    default:
      return { values: [], defaultSelected: '' }
  }
}

const SideMenu: React.FC<SideMenuProps> = ({ mainMenu }) => {
  const [collapsed, setCollapsed] = useState(false)

  const items = getMenuItems(mainMenu.key)

  return (
    items?.values && items.values?.length > 0 ? (
      < Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <Menu mode="inline" items={items.values} defaultSelectedKeys={[items.defaultSelected]} />
      </Sider >
    ) : null
  )
}

export default SideMenu
