import { IconFont } from '@/components/icon'
import type { ProLayoutProps } from '@ant-design/pro-components'

const routeConfig = {
    route: {
        path: '/',
        routes: [
            {
                path: '/dashboard',
                name: 'Dashboard',
                routes: [
                    {
                        path: '/dashboard',
                        name: 'Dashboard',
                        icon: <IconFont type="icon-fuwuqi" />
                    }
                ]
            },
            {
                path: '/virtual',
                name: '虚拟资源',
                routes: [
                    {
                        path: '/virtual/machines',
                        name: '虚拟机',
                        icon: <IconFont type="icon-fuwuqi" />
                    },
                    {
                        path: '/virtual/images',
                        name: '镜像',
                        icon: <IconFont type="icon-jingxiangwenjian-iso-copy" />
                    },
                    {
                        path: '/virtual/disks',
                        name: '磁盘',
                        icon: <IconFont type="icon-disk" />
                    }
                ]
            },
            {
                path: '/physical',
                name: '物理资源',
                routes: [
                    {
                        path: '/physical/machines',
                        name: '物理机',
                        icon: <IconFont type="icon-fuwuqi" />
                    },
                    {
                        path: '/physical/storages',
                        name: '存储',
                        icon: <IconFont type="icon-disk" />
                    }
                ]
            },
            {
                path: '/network',
                name: '网络资源',
                routes: [
                    {
                        path: '/network/multus',
                        name: 'Multus',
                        icon: <IconFont type="icon-select-sub-rfe" />
                    },
                    {
                        path: '/network/provider-networks',
                        name: 'Provider Network',
                        icon: <IconFont type="icon-select-sub-rfe" />
                    },
                    {
                        path: '/network/vlans',
                        name: 'VLAN',
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
                    }
                ]
            },
            {
                path: '/task',
                name: '任务管理',
                routes: [
                    {
                        path: '/task/clones',
                        name: '克隆',
                        icon: <IconFont type="icon-fuwuqi" />
                    },
                    {
                        path: '/task/events',
                        name: '事件',
                        icon: <IconFont type="icon-fuwuqi" />
                    }
                ]
            },
            // {
            //     path: '/plugin',
            //     name: '插件管理',
            //     routes: [
            //         {
            //             path: '/plugin/installer',
            //             name: '插件',
            //             icon: <IconFont type="icon-fuwuqi" />
            //         }
            //     ]
            // },
            // {
            //     hideInMenu: true,
            //     path: '/compute',
            //     name: '计算资源',
            //     routes: [
            //         {
            //             path: '/compute/hosts',
            //             name: '主机',
            //             icon: <IconFont type="icon-fuwuqi" />
            //         },
            //         {
            //             path: '/compute/machines',
            //             name: '虚拟机',
            //             icon: <IconFont type="icon-xuniji1" />
            //         }
            //     ]
            // },
            // {
            //     hideInMenu: true,
            //     path: '/storage',
            //     name: '存储',
            //     routes: [
            //         {
            //             path: '/storage/images',
            //             name: '镜像',
            //             icon: <IconFont type="icon-jingxiangwenjian-iso-copy" />
            //         },
            //         {
            //             path: '/storage/disks',
            //             name: '磁盘',
            //             icon: <IconFont type="icon-disk" />
            //         }
            //     ]
            // },
            // {
            //     hideInMenu: true,
            //     path: '/network',
            //     name: '网络',
            //     routes: [
            //         {
            //             path: '/network/multus',
            //             name: 'Multus CR',
            //             icon: <IconFont type="icon-select-sub-rfe" />
            //         },
            //         {
            //             path: '/network/vpcs',
            //             name: 'VPC',
            //             icon: <IconFont type="icon-VPC1" />
            //         },
            //         {
            //             path: '/network/subnets',
            //             name: '子网',
            //             icon: <IconFont type="icon-wangluo1-copy" />
            //         },
            //         {
            //             path: '/network/ippools',
            //             name: 'IP 地址池',
            //             icon: <IconFont type="icon-IPchi" />
            //         }
            //     ]
            // }
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
