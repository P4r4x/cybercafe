import React from 'react'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'

/**
 * 确认弹窗使用示例
 */
export const ConfirmDialogExample: React.FC = () => {
  const { confirm, DialogComponent } = useConfirmDialog()

  const handleDangerAction = async () => {
    const confirmed = await confirm({
      title: '删除确认',
      message: '此操作不可撤销，确定要删除这本书吗？',
      confirmText: '确认删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        console.log('执行删除操作')
        // 这里执行实际的删除逻辑
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    })

    if (confirmed) {
      console.log('用户确认了删除操作')
    }
  }

  const handleBorrowAction = async () => {
    const confirmed = await confirm({
      title: '借阅确认',
      message: '确定要借阅这本书吗？借阅后请在7天内归还。',
      confirmText: '确认借阅',
      cancelText: '再想想',
      type: 'primary',
      onConfirm: async () => {
        console.log('执行借阅操作')
        // 这里执行实际的借阅逻辑
      }
    })
  }

  const handleRemoveFromShelf = async () => {
    const confirmed = await confirm({
      title: '移除书架',
      message: '确定要将这本书从你的书架中移除吗？',
      confirmText: '确认移除',
      cancelText: '取消',
      type: 'warning',
      onConfirm: async () => {
        console.log('执行移除操作')
        // 这里执行实际的移除逻辑
      }
    })
  }

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-semibold mb-4">确认弹窗示例</h2>
      
      <div className="space-y-3">
        <button
          onClick={handleDangerAction}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          危险操作 (删除)
        </button>

        <button
          onClick={handleBorrowAction}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
        >
          主要操作 (借阅)
        </button>

        <button
          onClick={handleRemoveFromShelf}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          警告操作 (移除)
        </button>
      </div>

      {/* 弹窗组件 */}
      <DialogComponent />
    </div>
  )
}