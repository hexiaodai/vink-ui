import { DesktopOutlined } from '@ant-design/icons'
import { IconFont } from '@/components/icon'
import type { ProLayoutProps } from '@ant-design/pro-components'

const routeConfig = {
    route: {
        path: '/',
        routes: [
            {
                path: '/virtual',
                name: '虚拟资源',
                routes: [
                    {
                        path: '/virtual/machines',
                        name: '虚拟机',
                        icon: <DesktopOutlined />
                    },
                    {
                        path: '/virtual/images',
                        name: '镜像',
                        icon: <IconFont type="icon-guangpan" />
                    },
                    {
                        path: '/virtual/disks',
                        name: '磁盘',
                        icon: <IconFont type="icon-disk" />
                    }
                ]
            }
        ]
    }
}

export const LayoutSettings: ProLayoutProps = {
    ...routeConfig,
    menu: { type: 'group' },
    avatarProps: { src: 'https://avatars.githubusercontent.com/u/40925990?v=4', size: 'small', title: 'hexiaodai' },
    title: 'Vink',
    logo: 'https://avatars.githubusercontent.com/u/173601901?s=48&v=4',
    layout: 'mix',
    fixSiderbar: true,
    splitMenus: true
    // menuItemRender: (item, dom) => <NavLink onClick={() => setPathname(item.path || '/')} to={item.path || '/'}>{dom}</NavLink>
}
