'use client'

import { ChakraProvider as Chakra, extendTheme } from '@chakra-ui/react'
import theme from '@/theme'

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <Chakra theme={theme}>
      {children}
    </Chakra>
  )
}