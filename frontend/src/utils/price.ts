/**
 * 格式化价格显示
 * @param price 价格字符串（后端传递的字符串格式，防止精度损失）
 * @returns 格式化后的价格字符串，如 "¥65.00"
 */
export const formatPrice = (price: string | undefined): string => {
  if (!price) {
    return '¥0.00'
  }
  
  const numPrice = parseFloat(price)
  if (isNaN(numPrice)) {
    return '¥0.00'
  }
  
  return `¥${numPrice.toFixed(2)}`
}