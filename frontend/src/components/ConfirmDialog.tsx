import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext =
  createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx)
    throw new Error(
      "useConfirm must be used within ConfirmProvider"
    )
  return ctx.confirm
}

export function ConfirmProvider({
  children,
}: {
  children: ReactNode
}) {
  const [state, setState] = useState<{
    options: ConfirmOptions
    resolve: (v: boolean) => void
  } | null>(null)

  function confirm(options: ConfirmOptions) {
    return new Promise<boolean>(resolve => {
      setState({ options, resolve })
    })
  }

  function close(result: boolean) {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {state && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="
                w-[320px] rounded-2xl bg-white p-6
                shadow-xl
              "
            >
              {state.options.title && (
                <h3 className="text-lg font-semibold mb-2">
                  {state.options.title}
                </h3>
              )}

              <p className="text-sm text-gray-600 mb-6">
                {state.options.message}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => close(false)}
                  className="
                    rounded-xl px-4 py-2 text-sm
                    text-gray-600 hover:bg-gray-100
                  "
                >
                  {state.options.cancelText ?? "取消"}
                </button>

                <button
                  onClick={() => close(true)}
                  className="
                    rounded-xl px-4 py-2 text-sm font-medium
bg-gradient-to-r
                    from-pink-300 to-rose-300
                    text-white
                    hover:brightness-105
                  "
                >
                  {state.options.confirmText ?? "确认"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}
