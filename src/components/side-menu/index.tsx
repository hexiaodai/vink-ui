import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { IconFont } from '@/components/icon/index'
import { DesktopOutlined, GlobalOutlined } from '@ant-design/icons'
import Sider from 'antd/es/layout/Sider'

interface SideMenuProps { }

type ItemObject = {
  key: string
  items: Required<MenuProps>['items'][number][]
}

const virtual: ItemObject = {
  key: '/virtual',
  items: [
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
  ]
}

const itemObjects = [virtual]

const SideMenu: React.FC<SideMenuProps> = () => {
  const [collapsed, setCollapsed] = useState(false)

  const location = useLocation()
  const currentPath = location.pathname

  const itemObject = itemObjects.find(obj => {
    return currentPath.startsWith(obj?.key as string)
  })

  let defaultSelectedKey = itemObject?.items.find(item => {
    return currentPath.startsWith(item?.key as string)
  })?.key as string

  if (defaultSelectedKey === undefined || defaultSelectedKey.length === 0) {
    defaultSelectedKey = itemObject?.items[0]?.key as string
  }

  return (
    itemObject?.items && itemObject.items.length > 0 ? (
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <Menu mode="inline" items={itemObject.items} defaultSelectedKeys={[defaultSelectedKey]} />
      </Sider >
    ) : null
  )
}

export default SideMenu
