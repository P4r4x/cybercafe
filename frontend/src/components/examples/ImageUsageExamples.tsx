import React from 'react'
import { SmartImage, Avatar, BookCover, ImagePlaceholder } from '@/components/ui/SmartImage'
import { Book, User } from 'lucide-react'

/**
 * 图片使用示例组件
 * 展示如何使用SmartImage系统处理用户头像和图书封面
 */
const ImageUsageExamples: React.FC = () => {
  // 示例数据
  const examples = {
    // 用户头像示例
    userWithAvatar: 'https://picsum.photos/seed/user1/100/100.jpg',
    userWithoutAvatar: null,
    invalidUserAvatar: 'https://invalid-url.com/avatar.jpg',
    
    // 图书封面示例
    bookWithCover: 'https://picsum.photos/seed/book1/200/300.jpg',
    bookWithoutCover: null,
    invalidBookCover: 'https://invalid-url.com/cover.jpg',
    
    // 其他图片示例
    validImage: 'https://picsum.photos/seed/example/300/200.jpg',
    invalidImage: 'https://invalid-url.com/image.jpg'
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">图片使用示例</h1>

      {/* 用户头像示例 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          用户头像示例
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">有效头像</h3>
            <Avatar
              src={examples.userWithAvatar}
              alt="用户头像"
              width={80}
              height={80}
            />
            <p className="text-xs text-gray-500 mt-2">
              从后端获取的用户头像
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">无头像</h3>
            <Avatar
              src={examples.userWithoutAvatar}
              alt="默认头像"
              width={80}
              height={80}
            />
            <p className="text-xs text-gray-500 mt-2">
              使用默认头像图片
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">无效头像</h3>
            <Avatar
              src={examples.invalidUserAvatar}
              alt="失败后的默认头像"
              width={80}
              height={80}
            />
            <p className="text-xs text-gray-500 mt-2">
              加载失败后自动使用默认图片
            </p>
          </div>
        </div>
      </section>

      {/* 图书封面示例 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Book className="w-5 h-5" />
          图书封面示例
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">有效封面</h3>
            <BookCover
              src={examples.bookWithCover}
              alt="图书封面"
              width={120}
              height={160}
            />
            <p className="text-xs text-gray-500 mt-2">
              从后端获取的图书封面
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">无封面</h3>
            <BookCover
              src={examples.bookWithoutCover}
              alt="默认封面"
              width={120}
              height={160}
            />
            <p className="text-xs text-gray-500 mt-2">
              使用默认封面图片
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">无效封面</h3>
            <BookCover
              src={examples.invalidBookCover}
              alt="失败后的默认封面"
              width={120}
              height={160}
            />
            <p className="text-xs text-gray-500 mt-2">
              加载失败后自动使用默认图片
            </p>
          </div>
        </div>
      </section>

      {/* 通用图片示例 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">通用图片组件</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">有效图片</h3>
            <SmartImage
              src={examples.validImage}
              alt="示例图片"
              width={200}
              height={150}
              className="rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              正常加载的图片
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">无效图片</h3>
            <SmartImage
              src={examples.invalidImage}
              alt="默认图片"
              width={200}
              height={150}
              className="rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              加载失败后的默认图片
            </p>
          </div>
        </div>
      </section>

      {/* 占位符示例 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">占位符示例</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">文字占位符</h3>
            <ImagePlaceholder
              width="100%"
              height="120px"
              text="暂无图片"
              icon={<Book className="w-8 h-8" />}
            />
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">无图标占位符</h3>
            <ImagePlaceholder
              width="100%"
              height="120px"
              text="暂无图片"
            />
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">自定义大小</h3>
            <ImagePlaceholder
              width={150}
              height={150}
              text="150x150"
              icon={<User className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* 使用说明 */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <div className="space-y-3 text-sm">
          <p><strong>1. 基本用法：</strong></p>
          <pre className="bg-white p-3 rounded border">
{`<Avatar src={user.avatar} alt="用户头像" />
<BookCover src={book.cover_url} alt="图书封面" />
<SmartImage src={imageUrl} type="avatar" alt="图片" />`}
          </pre>

          <p><strong>2. 自定义样式：</strong></p>
          <pre className="bg-white p-3 rounded border">
{`<SmartImage 
  src={imageUrl}
  width={100}
  height={100}
  className="rounded-lg shadow-md"
  style={{ border: '2px solid #ccc' }}
/>`}
          </pre>

          <p><strong>3. 错误处理：</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>自动使用默认图片兜底</li>
            <li>支持加载状态显示</li>
            <li>提供错误回调处理</li>
            <li>图片验证和超时控制</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default ImageUsageExamples