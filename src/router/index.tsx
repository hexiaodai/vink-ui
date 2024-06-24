import { Route, Routes } from "react-router-dom"
import VirtualMachineList from '@/pages/virtualmachine/list'
import VirtualMachineCreate from '@/pages/virtualmachine/create'

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<VirtualMachineList />} />
            <Route path="virtualmachines">
                <Route path="" element={<VirtualMachineList />} />
                <Route path="create" element={<VirtualMachineCreate />} />
            </Route>
        </Routes>
    )
}

export default AppRouter
