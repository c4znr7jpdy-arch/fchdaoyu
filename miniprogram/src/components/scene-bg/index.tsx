import { View, Image } from '@tarojs/components'
import './index.css'

interface SceneBgProps {
  src: string
}

export default function SceneBg({ src }: SceneBgProps) {
  return (
    <View className='scene-bg'>
      <Image src={src} className='scene-bg-img' mode='aspectFill' />
    </View>
  )
}
