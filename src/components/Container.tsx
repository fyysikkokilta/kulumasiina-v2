import { Divider } from 'antd'
import { PropsWithChildren } from 'react'

import type { User } from '@/lib/auth'

import { Header } from './Header'

type ContainerProps = PropsWithChildren & {
  width: 'narrow' | 'wide'
  user: User | null
}

export function Container({ children, width, user }: ContainerProps) {
  const widthClasses = {
    narrow: 'max-w-3xl mx-auto',
    wide: 'max-w-6xl mx-auto'
  }

  return (
    <div className="m-8 min-h-screen px-4">
      <div className={`${widthClasses[width]} w-full`}>
        <Header user={user} />
        <Divider />
        <div className="grower">{children}</div>
      </div>
    </div>
  )
}
