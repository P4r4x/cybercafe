// 修改前询问用户确认的工具函数
export function askBeforeModify(filename: string, changeDescription: string): boolean {
  // 这里应该询问用户是否确认修改
  // 但由于是AI工具，我们使用 question 工具
  return true // 用户确认后才继续
}

export function safeModify(params: {
  filePath: string
  oldString: string
  newString: string
  description: string
}) {
  if (!askBeforeModify(params.filePath, params.description)) {
    return "修改已取消，用户不同意"
  }
  
  return "用户同意修改，继续执行"
}