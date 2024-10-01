import { IconFont } from '@/components/icon'
import type { ProLayoutProps } from '@ant-design/pro-components'

const routeConfig = {
    route: {
        path: '/',
        routes: [
            {
                path: '/compute',
                name: '计算资源',
                routes: [
                    {
                        path: '/compute/hosts',
                        name: '主机',
                        icon: <IconFont type="icon-fuwuqi" />
                    },
                    {
                        path: '/compute/machines',
                        name: '虚拟机',
                        icon: <IconFont type="icon-xuniji1" />
                    }
                ]
            },
            {
                path: '/storage',
                name: '存储',
                routes: [
                    {
                        path: '/storage/images',
                        name: '镜像',
                        icon: <IconFont type="icon-jingxiangwenjian-iso-copy" />
                    },
                    {
                        path: '/storage/disks',
                        name: '磁盘',
                        icon: <IconFont type="icon-disk" />
                    }
                ]
            },
            {
                path: '/network',
                name: '网络',
                routes: [
                    {
                        path: '/network/multus',
                        name: 'Multus CR',
                        icon: <IconFont type="icon-select-sub-rfe" />
                    },
                    {
                        path: '/network/vpcs',
                        name: 'VPC',
                        icon: <IconFont type="icon-VPC1" />
                    },
                    {
                        path: '/network/subnets',
                        name: '子网',
                        icon: <IconFont type="icon-wangluo1-copy" />
                    },
                    {
                        path: '/network/ippools',
                        name: 'IP 地址池',
                        icon: <IconFont type="icon-IPchi" />
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
    layout: 'side',
    // layout: 'mix',
    fixSiderbar: true,
    // splitMenus: true
    // menuItemRender: (item, dom) => <NavLink onClick={() => setPathname(item.path || '/')} to={item.path || '/'}>{dom}</NavLink>
}
