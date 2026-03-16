import React from 'react'
import Header from '@/app/page/common/header'
import ContractTable from '@/app/page/contract_table'

const NotificationsPage = () => {
  return (
    <div className=" h-screen overflow-y-auto">
      <Header
        title="Notifications"
        description="View and manage your system notifications and contract notices."
      />
      <div className="">
        <ContractTable />
      </div>
    </div>
  )
}

export default NotificationsPage