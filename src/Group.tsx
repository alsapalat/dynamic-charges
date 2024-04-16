import React from 'react'

type Props = {
  label: string
  className?: string
  children: React.ReactNode
}

function Group({
  label,
  className,
  children,
}: Props) {
  return (
    <div className="mt-3">
      <div className="relative border rounded-lg p-3">
        <div className="border px-2 absolute top-0 left-0 translate-x-2 translate-y-[-50%] bg-gray-200 rounded inline-block text-xs font-semibold">{label}</div>
        <div className={className}>{children}</div>
      </div>
    </div>
  )
}

export default Group