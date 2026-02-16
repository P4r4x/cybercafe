import { useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
  texts: string[]
  speed?: number
  deleteSpeed?: number
  pauseTime?: number
  className?: string
}

export default function TypewriterText({
  texts,
  speed = 80,
  deleteSpeed = 40,
  pauseTime = 2000,
  className = '',
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const stateRef = useRef({ textIndex: 0, isDeleting: false })
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const animate = () => {
      const { textIndex, isDeleting } = stateRef.current
      const currentText = texts[textIndex]
      const currentDisplayed = displayedText

      if (isDeleting) {
        if (currentDisplayed.length > 0) {
          const newText = currentText.slice(0, currentDisplayed.length - 1)
          setDisplayedText(newText)
          timeoutRef.current = setTimeout(animate, deleteSpeed)
        } else {
          stateRef.current.isDeleting = false
          stateRef.current.textIndex = (textIndex + 1) % texts.length
          timeoutRef.current = setTimeout(animate, pauseTime)
        }
      } else {
        if (currentDisplayed.length < currentText.length) {
          const newText = currentText.slice(0, currentDisplayed.length + 1)
          setDisplayedText(newText)
          timeoutRef.current = setTimeout(animate, speed)
        } else {
          timeoutRef.current = setTimeout(() => {
            stateRef.current.isDeleting = true
            animate()
          }, pauseTime)
        }
      }
    }

    timeoutRef.current = setTimeout(animate, speed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [texts, speed, deleteSpeed, pauseTime, displayedText])

  return (
    <h2 className={`text-2xl font-light tracking-wide ${className}`}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </h2>
  )
}
